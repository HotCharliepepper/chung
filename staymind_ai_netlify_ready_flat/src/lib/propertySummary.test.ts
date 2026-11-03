import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeProperty } from "./propertySummary.ts";
import { createEmptyData } from "./propertyStorage.ts";
import { SAMPLE_FAQS, SAMPLE_PROPERTY } from "../data/sampleProperty.ts";

test("빈 데이터는 0/9", () => {
  const s = summarizeProperty(createEmptyData());
  assert.equal(s.filledCount, 0);
  assert.equal(s.totalCount, 9);
  assert.equal(s.percent, 0);
  assert.equal(s.faqCount, 0);
});

test("일부만 입력하면 빈 항목을 알려준다", () => {
  const d = createEmptyData();
  d.property.name = "세한 스테이";
  d.property.checkIn = "15:00";
  d.property.wifi = "   ";
  d.faqs = [
    { id: "1", question: "q", answer: "a" },
    { id: "2", question: "q만", answer: "" },
  ];
  const s = summarizeProperty(d);
  assert.equal(s.filledCount, 2);
  assert.equal(s.percent, 22);
  assert.ok(s.missingKeys.includes("wifi"));
  assert.equal(s.faqCount, 1);
});

test("예시 숙소는 9개 항목과 FAQ 11개가 모두 채워져 있다", () => {
  const d = createEmptyData();
  d.property = { ...SAMPLE_PROPERTY };
  d.faqs = SAMPLE_FAQS.map((f, i) => ({ id: String(i), ...f }));
  const s = summarizeProperty(d);
  assert.equal(s.filledCount, 9);
  assert.equal(s.faqCount, 11);
  assert.equal(SAMPLE_PROPERTY.name, "어반스테이 강남");
  assert.match(SAMPLE_PROPERTY.wifi, /직접 입력/);
  assert.match(SAMPLE_PROPERTY.location, /정확한 주소: 직접 입력/);
});
