// 서버 전용: 공식 Anthropic SDK로 Claude를 호출한다. 클라이언트 컴포넌트에서 import 하지 않는다.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { DraftModelClient } from "./draftHandler.ts";

export function createAnthropicClient(apiKey: string): DraftModelClient {
  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 });
  return {
    async generate({ model, system, userMessage, maxTokens }) {
      const message = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userMessage }],
      });
      return message.content
        .filter((block) => block.type === "text")
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("\n");
    },
  };
}
