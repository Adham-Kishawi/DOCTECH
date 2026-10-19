export interface LlmChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || "qwen/qwen-2.5-72b-instruct";
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || "thudm/glm-4-9b-chat";

export async function callOpenRouter(
  messages: LlmChatMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. The WhatsApp assistant cannot answer without a real model."
    );
  }

  // 1. Try Primary Model (Qwen 3.5 / 2.5)
  try {
    const res = await attemptModelCall(PRIMARY_MODEL, messages, apiKey, options);
    if (res) return res;
  } catch (primaryErr) {
    console.warn(`Primary AI Model (${PRIMARY_MODEL}) failed. Falling back to GLM-4:`, primaryErr);
  }

  // 2. Fallback Model (GLM-4)
  const fallbackRes = await attemptModelCall(FALLBACK_MODEL, messages, apiKey, options);
  if (fallbackRes) return fallbackRes;

  throw new Error(`OpenRouter returned no content from ${PRIMARY_MODEL} or ${FALLBACK_MODEL}`);
}

async function attemptModelCall(
  model: string,
  messages: LlmChatMessage[],
  apiKey: string,
  options: OpenRouterOptions
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://doctech.clinic",
      "X-Title": "DOCTECH Clinic OS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 500,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter HTTP ${response.status}: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
