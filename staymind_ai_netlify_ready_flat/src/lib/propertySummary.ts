// 대시보드에 보여줄 요약. 저장된 실제 값만 사용한다.
import type { PropertyData, PropertyInfo } from "../types/property.ts";

export const PROPERTY_FIELD_KEYS: (keyof PropertyInfo)[] = [
  "name",
  "location",
  "checkIn",
  "checkOut",
  "parking",
  "wifi",
  "amenities",
  "rules",
  "notes",
];

export type PropertySummary = {
  filledCount: number;
  totalCount: number;
  percent: number;
  missingKeys: (keyof PropertyInfo)[];
  faqCount: number;
};

export function summarizeProperty(data: PropertyData): PropertySummary {
  const missingKeys = PROPERTY_FIELD_KEYS.filter((k) => (data.property[k] ?? "").trim() === "");
  const totalCount = PROPERTY_FIELD_KEYS.length;
  const filledCount = totalCount - missingKeys.length;
  const faqCount = data.faqs.filter((f) => f.question.trim() !== "" && f.answer.trim() !== "").length;
  return {
    filledCount,
    totalCount,
    percent: Math.round((filledCount / totalCount) * 100),
    missingKeys,
    faqCount,
  };
}
