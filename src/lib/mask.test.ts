import { test } from "node:test";
import assert from "node:assert/strict";
import { describeMasking, maskPersonalInfo } from "./mask.ts";

test("휴대폰 번호 여러 형식을 가린다", () => {
  for (const phone of ["010-1234-5678", "01012345678", "010 1234 5678", "010.1234.5678", "011-123-4567"]) {
    const r = maskPersonalInfo(`연락처는 ${phone} 입니다`);
    assert.equal(r.masked, "연락처는 [전화번호] 입니다", phone);
    assert.equal(r.phoneCount, 1);
  }
});

test("지역번호, 대표번호, 국제번호를 가린다", () => {
  assert.equal(maskPersonalInfo("02-123-4567").masked, "[전화번호]");
  assert.equal(maskPersonalInfo("031-1234-5678").masked, "[전화번호]");
  assert.equal(maskPersonalInfo("1588-1234로 전화").masked, "[전화번호]로 전화");
  assert.equal(maskPersonalInfo("+82 10-1234-5678").masked, "[전화번호]");
  assert.equal(maskPersonalInfo("+82-10-1234-5678").masked, "[전화번호]");
});

test("이메일을 가린다", () => {
  const r = maskPersonalInfo("메일 guest@mail.com, kim.ys+trip@naver.co.kr 로 주세요");
  assert.equal(r.masked, "메일 [이메일], [이메일] 로 주세요");
  assert.equal(r.emailCount, 2);
  assert.equal(r.phoneCount, 0);
});

test("전화번호와 이메일이 섞여 있어도 각각 센다", () => {
  const r = maskPersonalInfo("010-1234-5678 / guest@mail.com / 010-9999-8888");
  assert.equal(r.masked, "[전화번호] / [이메일] / [전화번호]");
  assert.equal(r.phoneCount, 2);
  assert.equal(r.emailCount, 1);
});

test("날짜, 시간, 금액, 인원은 가리지 않는다", () => {
  const text = "2027-01-11부터 2박, 15:00 체크인, 성인 2명, 50,000원, 1월 13일 11시";
  const r = maskPersonalInfo(text);
  assert.equal(r.masked, text);
  assert.equal(r.phoneCount + r.emailCount, 0);
});

test("가린 내용 안내 문구", () => {
  assert.equal(describeMasking(maskPersonalInfo("안녕하세요")), null);
  assert.equal(
    describeMasking(maskPersonalInfo("010-1234-5678 a@b.com")),
    "개인정보 보호를 위해 전화번호 1개, 이메일 1개를 가린 뒤 AI에 보냈습니다.",
  );
});
