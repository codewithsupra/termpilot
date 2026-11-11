import type { google } from "@ai-sdk/google";

// The model type the AI SDK expects from a provider.
export type FallbackModel = ReturnType<typeof google>;

type StreamResult = Awaited<ReturnType<FallbackModel["doStream"]>>;
type StreamPart = StreamResult["stream"] extends ReadableStream<infer P> ? P : never;

// Errors that mean "this model cannot answer right now, another one might": the free
// daily or per-minute quota is used up (429), or the model is overloaded or failing (500,
// 503). Anything else (bad request, bad key) would fail on every model, so it is shown.
export function isTryAnotherModelError(error: unknown) {
  if (error == null || typeof error !== "object") return false;

  const { statusCode, message } = error as { statusCode?: number; message?: unknown };
  if (statusCode === 429 || statusCode === 500 || statusCode === 503) return true;

  return (
    typeof message === "string" &&
    /quota|resource_exhausted|high demand|overloaded|unavailable/i.test(message)
  );
}

// Parts that arrive before the model has produced anything. Until a part that is not one
// of these shows up, switching to another model is still invisible to the user.
const PRE_CONTENT_PARTS = new Set(["stream-start", "response-metadata"]);

function replay(buffered: StreamPart[], reader: ReadableStreamDefaultReader<StreamPart>) {
  return new ReadableStream<StreamPart>({
    start(controller) {
      for (const part of buffered) controller.enqueue(part);
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

// Wraps several models of one provider into one. The first model that can start answering
// is used. If it fails before sending any content with a "try another model" error, the next
// one is tried. Once content has started streaming, the choice is final.
export function withModelFallback(models: FallbackModel[]): FallbackModel {
  const [primary] = models;
  if (!primary) throw new Error("withModelFallback needs at least one model");
  if (models.length === 1) return primary;

  const last = models.length - 1;

  return {
    specificationVersion: primary.specificationVersion,
    provider: primary.provider,
    modelId: primary.modelId,
    supportedUrls: primary.supportedUrls,

    async doGenerate(options) {
      for (let i = 0; i < last; i++) {
        try {
          return await models[i]!.doGenerate(options);
        } catch (error) {
          if (!isTryAnotherModelError(error)) throw error;
        }
      }
      return models[last]!.doGenerate(options);
    },

    async doStream(options) {
      for (let i = 0; i < last; i++) {
        try {
          const result = await models[i]!.doStream(options);
          const reader = result.stream.getReader();
          const buffered: StreamPart[] = [];

          // Read until the model starts answering, or fails.
          while (true) {
            const { done, value } = await reader.read();
            if (done) return { ...result, stream: replay(buffered, reader) };

            buffered.push(value);

            if (value.type === "error" && isTryAnotherModelError(value.error)) {
              await reader.cancel();
              break; // try the next model
            }

            if (value.type === "error" || !PRE_CONTENT_PARTS.has(value.type)) {
              return { ...result, stream: replay(buffered, reader) };
            }
          }
        } catch (error) {
          if (!isTryAnotherModelError(error)) throw error;
        }
      }
      return models[last]!.doStream(options);
    },
  };
}
