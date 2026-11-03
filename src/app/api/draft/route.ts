// POST /api/draft : 고객 문의 + 숙소 정보 → AI 답변 초안
// API 키는 서버에서만 process.env로 읽는다. (NEXT_PUBLIC_ 접두사 사용 금지)
import { createAnthropicClient } from "@/lib/anthropicClient";
import { handleDraftRequest } from "@/lib/draftHandler";

export async function POST(request: Request) {
  return handleDraftRequest(request, {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
    createClient: createAnthropicClient,
  });
}
