// /api/draft 요청 처리 로직. AI 클라이언트를 바깥에서 넣어 주므로 실제 키 없이 테스트할 수 있다.
// 주의: 고객 문의와 초안은 저장하거나 로그로 남기지 않는다.
import { maskPersonalInfo } from "./mask.ts";
import { buildUserMessage, validateDraftRequest } from "./draftPrompt.ts";
import { SYSTEM_PROMPT } from "./systemPrompt.ts";

export const DEFAULT_MODEL = "claude-sonnet-5-5";
export const MAX_OUTPUT_TOKENS = 4000;

export type GenerateArgs = {
  model: string;
  system: string;
  userMessage: string;
  maxTokens: number;
};

export type DraftModelClient = {
  generate(args: GenerateArgs): Promise<string>;
};

export type DraftHandlerDeps = {
  apiKey: string | undefined;
  model: string | undefined;
  createClient: (apiKey: string) => DraftModelClient;
};

export const MISSING_KEY_ERROR =
  "Claude API 키가 설정되어 있지 않습니다. 프로젝트 폴더(C:\\dev\\staymind-ai)에 .env.local 파일을 만들고 ANTHROPIC_API_KEY=발급받은키 한 줄을 넣은 뒤, 터미널에서 Ctrl+C로 멈추고 npm run dev를 다시 실행해 주세요.";

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function errorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

/** API 오류를 운영자가 이해할 수 있는 한국어 문구로 바꾼다. */
export function apiErrorMessage(err: unknown): { message: string; status: number } {
  const s = errorStatus(err);
  if (s === 401) {
    return {
      message: "Claude API 키가 올바르지 않습니다. .env.local의 ANTHROPIC_API_KEY 값을 다시 확인하고 npm run dev를 재시작해 주세요.",
      status: 502,
    };
  }
  if (s === 403) {
    return { message: "이 API 키로는 요청할 권한이 없습니다. Anthropic 콘솔에서 키 권한을 확인해 주세요.", status: 502 };
  }
  if (s === 404) {
    return {
      message: "설정된 AI 모델을 찾을 수 없습니다. .env.local의 ANTHROPIC_MODEL 값을 지우거나 올바른 모델 이름으로 바꿔 주세요.",
      status: 502,
    };
  }
  if (s === 400) {
    return {
      message: "AI 요청이 거절되었습니다. Anthropic 콘솔에서 크레딧(결제) 잔액을 확인하거나, 문의 내용을 조금 바꿔 다시 시도해 주세요.",
      status: 502,
    };
  }
  if (s === 429) {
    return { message: "요청이 많아 잠시 제한되었습니다. 1분 정도 뒤에 다시 시도해 주세요.", status: 503 };
  }
  if (s !== undefined && s >= 500) {
    return { message: "AI 서버가 일시적으로 응답하지 않습니다. 잠시 뒤에 다시 시도해 주세요.", status: 503 };
  }
  return {
    message: "AI 서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.",
    status: 502,
  };
}

export async function handleDraftRequest(req: Request, deps: DraftHandlerDeps): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "요청 형식이 올바르지 않습니다." }, 400);
  }

  const validated = validateDraftRequest(body);
  if (!validated.ok) return json({ error: validated.error }, 400);

  const apiKey = deps.apiKey?.trim();
  if (!apiKey) return json({ error: MISSING_KEY_ERROR }, 500);

  // 브라우저에서 이미 가렸지만, 서버에서도 한 번 더 가린다.
  const { masked } = maskPersonalInfo(validated.inquiry);
  const model = deps.model?.trim() || DEFAULT_MODEL;

  try {
    const client = deps.createClient(apiKey);
    const draft = (
      await client.generate({
        model,
        system: SYSTEM_PROMPT,
        userMessage: buildUserMessage(validated.data, masked),
        maxTokens: MAX_OUTPUT_TOKENS,
      })
    ).trim();
    if (draft === "") {
      return json({ error: "AI가 빈 답변을 돌려주었습니다. 다시 시도해 주세요." }, 502);
    }
    return json({ draft }, 200);
  } catch (err) {
    // 문의 내용은 남기지 않고, 상태 코드만 기록한다.
    console.error("[api/draft] Claude API 오류, status:", errorStatus(err) ?? "unknown");
    const { message, status } = apiErrorMessage(err);
    return json({ error: message }, status);
  }
}
