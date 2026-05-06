import Anthropic from "@anthropic-ai/sdk";

export const MODEL_DEFAULT =
  process.env.ANTHROPIC_MODEL_DEFAULT ?? "claude-sonnet-4-5";
export const MODEL_HEAVY =
  process.env.ANTHROPIC_MODEL_HEAVY ?? "claude-opus-4-5";

let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  _client = new Anthropic({ apiKey });
  return _client;
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function streamChat(opts: {
  model?: string;
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<ReadableStream<Uint8Array>> {
  const stream = await anthropic().messages.stream({
    model: opts.model ?? MODEL_DEFAULT,
    system: opts.system,
    messages: opts.messages,
    max_tokens: opts.maxTokens ?? 8000,
  });

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
