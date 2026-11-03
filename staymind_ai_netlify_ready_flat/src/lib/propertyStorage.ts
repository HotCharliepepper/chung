import type { FaqItem, PropertyData, PropertyInfo } from "@/types/property";

export const STORAGE_KEY = "staymind.property.v1";

/** localStorage와 같은 형태의 최소 인터페이스 (테스트에서 대체 가능) */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

export function createEmptyProperty(): PropertyInfo {
  return {
    name: "",
    location: "",
    checkIn: "",
    checkOut: "",
    parking: "",
    wifi: "",
    amenities: "",
    rules: "",
    notes: "",
  };
}

export function createEmptyData(): PropertyData {
  return {
    version: 1,
    property: createEmptyProperty(),
    faqs: [],
    updatedAt: null,
  };
}

export function createFaqId(): string {
  return `faq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** 저장된 값이 손상되었거나 일부 항목이 빠져 있어도 안전한 형태로 바꾼다. */
export function normalizeData(raw: unknown): PropertyData {
  const empty = createEmptyData();
  if (!raw || typeof raw !== "object") return empty;

  const obj = raw as Record<string, unknown>;
  const rawProperty =
    obj.property && typeof obj.property === "object"
      ? (obj.property as Record<string, unknown>)
      : {};

  const property = createEmptyProperty();
  for (const key of Object.keys(property) as (keyof PropertyInfo)[]) {
    property[key] = asString(rawProperty[key]);
  }

  const faqs: FaqItem[] = Array.isArray(obj.faqs)
    ? obj.faqs
        .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
        .map((f) => ({
          id: asString(f.id) || createFaqId(),
          question: asString(f.question),
          answer: asString(f.answer),
        }))
    : [];

  return {
    version: 1,
    property,
    faqs,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : null,
  };
}

export type LoadResult =
  | { ok: true; data: PropertyData; found: boolean }
  | { ok: false; data: PropertyData; error: string };

export function loadPropertyData(storage: KeyValueStorage | null): LoadResult {
  try {
    if (!storage) throw new Error("storage unavailable");
    const text = storage.getItem(STORAGE_KEY);
    if (text === null) return { ok: true, data: createEmptyData(), found: false };
    return { ok: true, data: normalizeData(JSON.parse(text)), found: true };
  } catch {
    return {
      ok: false,
      data: createEmptyData(),
      error:
        "저장된 숙소 정보를 불러오지 못했습니다. 빈 화면으로 시작합니다. (브라우저 저장소를 사용할 수 없거나 저장된 내용이 손상되었을 수 있습니다.)",
    };
  }
}

/** 저장 전 검사. 문제가 있으면 안내 문구를 돌려준다. */
export function validatePropertyData(data: PropertyData): string | null {
  if (data.property.name.trim() === "") {
    return "숙소 이름을 입력해 주세요. 숙소 이름은 필수 항목입니다.";
  }
  return null;
}

/** 질문과 답변이 모두 비어 있는 FAQ는 저장하지 않는다. */
export function cleanFaqs(faqs: FaqItem[]): FaqItem[] {
  return faqs.filter((f) => f.question.trim() !== "" || f.answer.trim() !== "");
}

export type SaveResult =
  | { ok: true; data: PropertyData }
  | { ok: false; error: string };

export function savePropertyData(
  storage: KeyValueStorage | null,
  data: PropertyData,
  now: Date = new Date(),
): SaveResult {
  const validationError = validatePropertyData(data);
  if (validationError) return { ok: false, error: validationError };

  const toSave: PropertyData = {
    ...data,
    faqs: cleanFaqs(data.faqs),
    updatedAt: now.toISOString(),
  };

  try {
    if (!storage) throw new Error("storage unavailable");
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return { ok: true, data: toSave };
  } catch {
    return {
      ok: false,
      error:
        "저장하지 못했습니다. 브라우저 저장소를 사용할 수 없거나 공간이 부족할 수 있습니다. 입력한 내용은 화면에 그대로 남아 있습니다.",
    };
  }
}

/** 브라우저의 localStorage를 안전하게 가져온다. 접근 자체가 막혀 있으면 null. */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}
