// 저장된 숙소 정보와 고객 문의로 AI에 보낼 메시지를 만든다.
import type { FaqItem, PropertyInfo } from "../types/property.ts";

export const MAX_INQUIRY_LENGTH = 2000;
export const MAX_FIELD_LENGTH = 3000;
export const MAX_FAQS = 50;
export const MAX_FAQ_TEXT_LENGTH = 1000;
export const MAX_CONTEXT_LENGTH = 30000;

export const FIELD_LABELS: Record<keyof PropertyInfo, string> = {
  name: "숙소 이름",
  location: "위치·찾아오는 길",
  checkIn: "체크인 시간",
  checkOut: "체크아웃 시간",
  parking: "주차 안내",
  wifi: "와이파이 안내",
  amenities: "편의시설",
  rules: "이용 규칙",
  notes: "기타 안내사항",
};

export type DraftPropertyInput = {
  property: PropertyInfo;
  faqs: FaqItem[];
};

/** 숙소 이름이 있어야 초안을 만들 수 있다. (설정 화면에서 이름은 필수) */
export function hasPropertyInfo(data: DraftPropertyInput | null | undefined): boolean {
  return !!data && typeof data.property?.name === "string" && data.property.name.trim() !== "";
}

/** 숙소 정보와 FAQ를 AI가 읽기 쉬운 텍스트로 만든다. 빈 항목은 넣지 않는다. */
export function buildPropertyContext(data: DraftPropertyInput): string {
  const lines: string[] = ["[숙소 정보]"];
  for (const key of Object.keys(FIELD_LABELS) as (keyof PropertyInfo)[]) {
    const value = (data.property[key] ?? "").trim();
    if (value !== "") lines.push(`- ${FIELD_LABELS[key]}: ${value}`);
  }

  const faqs = data.faqs.filter((f) => f.question.trim() !== "" && f.answer.trim() !== "");
  lines.push("", "[자주 묻는 질문]");
  if (faqs.length === 0) {
    lines.push("(등록된 FAQ 없음)");
  } else {
    faqs.forEach((f, i) => {
      lines.push(`${i + 1}. Q: ${f.question.trim()}`, `   A: ${f.answer.trim()}`);
    });
  }
  return lines.join("\n");
}

/** AI에 보낼 사용자 메시지 (숙소 정보 + 마스킹된 문의) */
export function buildUserMessage(data: DraftPropertyInput, maskedInquiry: string): string {
  return [
    "<property_info>",
    buildPropertyContext(data),
    "</property_info>",
    "",
    "<guest_inquiry>",
    maskedInquiry.trim(),
    "</guest_inquiry>",
    "",
    "위 숙소 정보와 FAQ만 근거로, 고객 문의에 대한 답변 초안을 작성해 주세요.",
  ].join("\n");
}

export type ValidatedDraftRequest =
  | { ok: true; inquiry: string; data: DraftPropertyInput }
  | { ok: false; error: string };

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** 서버에서 요청 본문을 검사한다. 형식이 틀리거나 너무 길면 한국어 오류를 돌려준다. */
export function validateDraftRequest(body: unknown): ValidatedDraftRequest {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "요청 형식이 올바르지 않습니다." };
  }
  const obj = body as Record<string, unknown>;

  const inquiry = str(obj.inquiry);
  if (inquiry === null || inquiry.trim() === "") {
    return { ok: false, error: "고객 문의를 입력해 주세요." };
  }
  if (inquiry.length > MAX_INQUIRY_LENGTH) {
    return {
      ok: false,
      error: `고객 문의가 너무 깁니다. ${MAX_INQUIRY_LENGTH.toLocaleString("ko-KR")}자 이하로 줄여 주세요.`,
    };
  }

  const pd = obj.propertyData;
  if (!pd || typeof pd !== "object") {
    return { ok: false, error: "숙소 정보가 없습니다. 먼저 숙소 정보를 입력해 주세요." };
  }
  const rawProperty = (pd as Record<string, unknown>).property;
  const rawFaqs = (pd as Record<string, unknown>).faqs;
  if (!rawProperty || typeof rawProperty !== "object") {
    return { ok: false, error: "숙소 정보가 없습니다. 먼저 숙소 정보를 입력해 주세요." };
  }

  const property = {} as PropertyInfo;
  for (const key of Object.keys(FIELD_LABELS) as (keyof PropertyInfo)[]) {
    const value = (rawProperty as Record<string, unknown>)[key];
    const text = value === undefined || value === null ? "" : str(value);
    if (text === null) return { ok: false, error: "숙소 정보 형식이 올바르지 않습니다." };
    if (text.length > MAX_FIELD_LENGTH) {
      return {
        ok: false,
        error: `숙소 정보의 "${FIELD_LABELS[key]}" 항목이 너무 깁니다. ${MAX_FIELD_LENGTH.toLocaleString("ko-KR")}자 이하로 줄여 주세요.`,
      };
    }
    property[key] = text;
  }

  const faqs: FaqItem[] = [];
  if (rawFaqs !== undefined) {
    if (!Array.isArray(rawFaqs)) return { ok: false, error: "FAQ 형식이 올바르지 않습니다." };
    if (rawFaqs.length > MAX_FAQS) {
      return { ok: false, error: `FAQ가 너무 많습니다. ${MAX_FAQS}개 이하로 줄여 주세요.` };
    }
    for (const f of rawFaqs) {
      if (!f || typeof f !== "object") return { ok: false, error: "FAQ 형식이 올바르지 않습니다." };
      const r = f as Record<string, unknown>;
      const question = str(r.question) ?? "";
      const answer = str(r.answer) ?? "";
      if (question.length > MAX_FAQ_TEXT_LENGTH || answer.length > MAX_FAQ_TEXT_LENGTH) {
        return {
          ok: false,
          error: `FAQ 질문이나 답변이 너무 깁니다. ${MAX_FAQ_TEXT_LENGTH.toLocaleString("ko-KR")}자 이하로 줄여 주세요.`,
        };
      }
      faqs.push({ id: str(r.id) ?? "", question, answer });
    }
  }

  const data: DraftPropertyInput = { property, faqs };
  if (!hasPropertyInfo(data)) {
    return { ok: false, error: "숙소 이름이 비어 있습니다. 먼저 숙소 정보를 입력해 주세요." };
  }
  if (buildPropertyContext(data).length > MAX_CONTEXT_LENGTH) {
    return { ok: false, error: "숙소 정보와 FAQ 전체가 너무 깁니다. 내용을 조금 줄여 주세요." };
  }
  return { ok: true, inquiry, data };
}
