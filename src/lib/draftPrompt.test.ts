import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_INQUIRY_LENGTH,
  buildPropertyContext,
  buildUserMessage,
  hasPropertyInfo,
  validateDraftRequest,
  type DraftPropertyInput,
} from "./draftPrompt.ts";
import { SYSTEM_PROMPT, UNKNOWN_PHRASE } from "./systemPrompt.ts";

const sample: DraftPropertyInput = {
  property: {
    name: "세한 스테이",
    location: "",
    checkIn: "15:00",
    checkOut: "11:00",
    parking: "숙소 앞 무료 주차 1대",
    wifi: "",
    amenities: "",
    rules: "반려동물 동반 불가",
    notes: "",
  },
  faqs: [
    { id: "1", question: "아기 침대 있나요?", answer: "1개 무료 대여" },
    { id: "2", question: "  ", answer: "" },
  ],
};

test("숙소 정보 텍스트에 채워진 항목과 FAQ만 들어간다", () => {
  const ctx = buildPropertyContext(sample);
  assert.match(ctx, /숙소 이름: 세한 스테이/);
  assert.match(ctx, /체크인 시간: 15:00/);
  assert.match(ctx, /주차 안내: 숙소 앞 무료 주차 1대/);
  assert.match(ctx, /Q: 아기 침대 있나요\?\n {3}A: 1개 무료 대여/);
  assert.doesNotMatch(ctx, /와이파이/);
  assert.doesNotMatch(ctx, /2\. Q:/);
});

test("FAQ가 없으면 없다고 표시한다", () => {
  assert.match(buildPropertyContext({ ...sample, faqs: [] }), /등록된 FAQ 없음/);
});

test("사용자 메시지는 숙소 정보와 문의를 구분 태그로 감싼다", () => {
  const msg = buildUserMessage(sample, "  체크인 몇 시예요? [전화번호]  ");
  assert.match(msg, /<property_info>[\s\S]*<\/property_info>/);
  assert.match(msg, /<guest_inquiry>\n체크인 몇 시예요\? \[전화번호\]\n<\/guest_inquiry>/);
});

test("시스템 프롬프트에 지어내기 방지 규칙이 들어 있다", () => {
  assert.ok(SYSTEM_PROMPT.includes(UNKNOWN_PHRASE));
  for (const word of ["지어내지", "환불", "할인", "존댓말", "지시"]) {
    assert.ok(SYSTEM_PROMPT.includes(word), word);
  }
});

test("숙소 이름이 있어야 정보가 있다고 본다", () => {
  assert.equal(hasPropertyInfo(sample), true);
  assert.equal(hasPropertyInfo({ ...sample, property: { ...sample.property, name: " " } }), false);
  assert.equal(hasPropertyInfo(null), false);
});

test("요청 검사: 정상 요청", () => {
  const r = validateDraftRequest({ inquiry: "체크인 몇 시?", propertyData: sample });
  assert.equal(r.ok, true);
});

test("요청 검사: 빈 문의, 너무 긴 문의, 숙소 정보 없음", () => {
  const empty = validateDraftRequest({ inquiry: "  ", propertyData: sample });
  assert.equal(empty.ok, false);
  assert.equal(!empty.ok && empty.error, "고객 문의를 입력해 주세요.");

  const long = validateDraftRequest({ inquiry: "가".repeat(MAX_INQUIRY_LENGTH + 1), propertyData: sample });
  assert.equal(long.ok, false);

  const noProp = validateDraftRequest({ inquiry: "안녕하세요" });
  assert.equal(noProp.ok, false);

  const noName = validateDraftRequest({
    inquiry: "안녕하세요",
    propertyData: { ...sample, property: { ...sample.property, name: "" } },
  });
  assert.equal(noName.ok, false);

  assert.equal(validateDraftRequest(null).ok, false);
  assert.equal(validateDraftRequest({ inquiry: 3, propertyData: sample }).ok, false);
});

test("요청 검사: 너무 긴 항목과 너무 많은 FAQ", () => {
  const longField = validateDraftRequest({
    inquiry: "안녕",
    propertyData: { ...sample, property: { ...sample.property, notes: "가".repeat(3001) } },
  });
  assert.equal(longField.ok, false);
  const manyFaqs = validateDraftRequest({
    inquiry: "안녕",
    propertyData: { ...sample, faqs: Array.from({ length: 51 }, (_, i) => ({ id: `${i}`, question: "q", answer: "a" })) },
  });
  assert.equal(manyFaqs.ok, false);
});
