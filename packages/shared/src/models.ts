export type ModelPricing = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
};

export type SupportedProvider = "anthropic" | "openai" | "google";

type SupportedChatModelDefinition = {
  id: string;
  provider: SupportedProvider;
  pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
  { id: "claude-sonnet-4-6", provider: "anthropic", pricing: { inputUsdPerMillionTokens: 3, outputUsdPerMillionTokens: 15 } },
  { id: "claude-haiku-4-5", provider: "anthropic", pricing: { inputUsdPerMillionTokens: 1, outputUsdPerMillionTokens: 5 } },
  { id: "claude-opus-4-6", provider: "anthropic", pricing: { inputUsdPerMillionTokens: 5, outputUsdPerMillionTokens: 25 } },
  { id: "gpt-5.4", provider: "openai", pricing: { inputUsdPerMillionTokens: 2.5, outputUsdPerMillionTokens: 15 } },
  { id: "gpt-5.4-mini", provider: "openai", pricing: { inputUsdPerMillionTokens: 0.75, outputUsdPerMillionTokens: 4.5 } },
  { id: "gpt-5.4-nano", provider: "openai", pricing: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 1.25 } },
  // Gemini models have a free tier in the Gemini API (rate limited). The prices
  // below are the paid-tier list prices, in dollars per million tokens, as shown
  // on ai.google.dev/gemini-api/docs/pricing. They rise on 2027-01-01.
  { id: "gemini-3.8-flash", provider: "google", pricing: { inputUsdPerMillionTokens: 0.75, outputUsdPerMillionTokens: 3.75 } },
  { id: "gemini-3.6-flash", provider: "google", pricing: { inputUsdPerMillionTokens: 0.75, outputUsdPerMillionTokens: 3.75 } },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

// Takes a plain string on purpose: callers pass untrusted input (request bodies,
// saved preferences) and use the result to find out whether it is a valid id.
export function findSupportedChatModel(modelId: string) {
  return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

// Deviation from the tutorial (which defaults to claude-opus-4-6): a model with a free tier.
export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "gemini-3.8-flash";
