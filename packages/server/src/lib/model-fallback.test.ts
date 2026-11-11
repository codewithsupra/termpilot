import { describe, expect, test } from "bun:test";
import { isTryAnotherModelError, withModelFallback, type FallbackModel } from "./model-fallback";

type Part = Record<string, unknown>;

class QuotaError extends Error {
  statusCode = 429;
}

function streamOf(parts: Part[]) {
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });
}

// A fake model. `streamParts` is what doStream streams back; `throws` makes doStream fail.
function fakeModel(id: string, opts: { streamParts?: Part[]; throws?: Error; calls?: string[] }) {
  return {
    specificationVersion: "v3",
    provider: "fake",
    modelId: id,
    supportedUrls: {},
    async doGenerate() {
      opts.calls?.push(id);
      if (opts.throws) throw opts.throws;
      return { content: [{ type: "text", text: id }] };
    },
    async doStream() {
      opts.calls?.push(id);
      if (opts.throws) throw opts.throws;
      return { stream: streamOf(opts.streamParts ?? []) };
    },
  } as unknown as FallbackModel;
}

async function collect(model: FallbackModel) {
  const { stream } = await model.doStream({} as never);
  const parts: Part[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) return parts;
    parts.push(value as Part);
  }
}

const quotaAtStart = [
  { type: "stream-start" },
  { type: "error", error: new QuotaError("You exceeded your current quota") },
];
const goodAnswer = [
  { type: "stream-start" },
  { type: "text-delta", delta: "hi" },
  { type: "finish" },
];

describe("isTryAnotherModelError", () => {
  test("quota, overload and server errors qualify", () => {
    expect(isTryAnotherModelError(new QuotaError("x"))).toBe(true);
    expect(isTryAnotherModelError({ statusCode: 503 })).toBe(true);
    expect(isTryAnotherModelError(new Error("This model is currently experiencing high demand"))).toBe(true);
  });

  test("other errors do not", () => {
    expect(isTryAnotherModelError({ statusCode: 400, message: "bad request" })).toBe(false);
    expect(isTryAnotherModelError({ statusCode: 401, message: "API key not valid" })).toBe(false);
    expect(isTryAnotherModelError(null)).toBe(false);
  });
});

describe("withModelFallback", () => {
  test("uses the first model when it works", async () => {
    const calls: string[] = [];
    const model = withModelFallback([
      fakeModel("a", { streamParts: goodAnswer, calls }),
      fakeModel("b", { streamParts: goodAnswer, calls }),
    ]);
    expect((await collect(model)).map((p) => p.type)).toEqual(["stream-start", "text-delta", "finish"]);
    expect(calls).toEqual(["a"]);
  });

  test("moves on when the first model reports a quota error before any content", async () => {
    const calls: string[] = [];
    const model = withModelFallback([
      fakeModel("a", { streamParts: quotaAtStart, calls }),
      fakeModel("b", { streamParts: goodAnswer, calls }),
    ]);
    expect((await collect(model)).map((p) => p.type)).toEqual(["stream-start", "text-delta", "finish"]);
    expect(calls).toEqual(["a", "b"]);
  });

  test("moves on when the first model throws a quota error", async () => {
    const calls: string[] = [];
    const model = withModelFallback([
      fakeModel("a", { throws: new QuotaError("quota"), calls }),
      fakeModel("b", { throws: new QuotaError("quota"), calls }),
      fakeModel("c", { streamParts: goodAnswer, calls }),
    ]);
    expect((await collect(model)).length).toBe(3);
    expect(calls).toEqual(["a", "b", "c"]);
  });

  test("does not switch once content has started streaming", async () => {
    const calls: string[] = [];
    const midStreamFailure = [
      { type: "stream-start" },
      { type: "text-delta", delta: "partial" },
      { type: "error", error: new QuotaError("quota") },
    ];
    const model = withModelFallback([
      fakeModel("a", { streamParts: midStreamFailure, calls }),
      fakeModel("b", { streamParts: goodAnswer, calls }),
    ]);
    expect((await collect(model)).map((p) => p.type)).toEqual(["stream-start", "text-delta", "error"]);
    expect(calls).toEqual(["a"]);
  });

  test("does not switch for errors that would fail everywhere", async () => {
    const calls: string[] = [];
    const badKey = Object.assign(new Error("API key not valid"), { statusCode: 400 });
    const model = withModelFallback([
      fakeModel("a", { throws: badKey, calls }),
      fakeModel("b", { streamParts: goodAnswer, calls }),
    ]);
    await expect(collect(model)).rejects.toThrow("API key not valid");
    expect(calls).toEqual(["a"]);
  });

  test("when every model is out of quota, the last model's error is what you get", async () => {
    const model = withModelFallback([
      fakeModel("a", { streamParts: quotaAtStart }),
      fakeModel("b", { streamParts: quotaAtStart }),
    ]);
    const parts = await collect(model);
    expect(parts.at(-1)?.type).toBe("error");
  });

  test("generate falls back the same way", async () => {
    const model = withModelFallback([
      fakeModel("a", { throws: new QuotaError("quota") }),
      fakeModel("b", {}),
    ]);
    const result = await model.doGenerate({} as never);
    expect((result.content[0] as { text: string }).text).toBe("b");
  });
});
