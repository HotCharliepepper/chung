import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MODEL,
  MISSING_KEY_ERROR,
  handleDraftRequest,
  type DraftModelClient,
  type GenerateArgs,
} from "./draftHandler.ts";
import { SYSTEM_PROMPT } from "./systemPrompt.ts";

const propertyData = {
  property: {
    name: "세한 스테이", location: "", checkIn: "15:00", checkOut: "11:00",
    parking: "", wifi: "", amenities: "", rules: "", notes: "",
  },
  faqs: [],
};

function req(body: unknown): Request {
  return new Request("http://localhost/api/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function fakeClient(reply: string | Error) {
  const calls: { apiKey: string; args: GenerateArgs }[] = [];
  const createClient = (apiKey: string): DraftModelClient => ({
    async generate(args) {
      calls.push({ apiKey, args });
      if (reply instanceof Error) throw reply;
      return reply;
    },
  });
  return { calls, createClient };
}

test("키가 없으면 .env.local 안내 오류를 돌려주고 AI를 호출하지 않는다", async () => {
  const fake = fakeClient("x");
  const res = await handleDraftRequest(req({ inquiry: "체크인?", propertyData }), {
    apiKey: undefined, model: undefined, createClient: fake.createClient,
  });
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.error, MISSING_KEY_ERROR);
  assert.match(body.error, /\.env\.local/);
  assert.equal(fake.calls.length, 0);
});

test("공백 키도 없는 것으로 본다", async () => {
  const fake = fakeClient("x");
  const res = await handleDraftRequest(req({ inquiry: "체크인?", propertyData }), {
    apiKey: "   ", model: undefined, createClient: fake.createClient,
  });
  assert.equal(res.status, 500);
});

test("정상 요청: 기본 모델, 시스템 프롬프트, 서버 측 마스킹", async () => {
  const fake = fakeClient("  안녕하세요. 체크인은 15:00부터입니다.  ");
  const res = await handleDraftRequest(
    req({ inquiry: "체크인 몇 시? 제 번호 010-1234-5678", propertyData }),
    { apiKey: "test-key", model: undefined, createClient: fake.createClient },
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { draft: "안녕하세요. 체크인은 15:00부터입니다." });
  assert.equal(fake.calls.length, 1);
  const { apiKey, args } = fake.calls[0];
  assert.equal(apiKey, "test-key");
  assert.equal(args.model, DEFAULT_MODEL);
  assert.equal(args.system, SYSTEM_PROMPT);
  assert.match(args.userMessage, /\[전화번호\]/);
  assert.doesNotMatch(args.userMessage, /010-1234-5678/);
  assert.match(args.userMessage, /체크인 시간: 15:00/);
});

test("ANTHROPIC_MODEL 값이 있으면 그 모델을 쓴다", async () => {
  const fake = fakeClient("답변");
  await handleDraftRequest(req({ inquiry: "안녕하세요", propertyData }), {
    apiKey: "k", model: "claude-haiku-5-5", createClient: fake.createClient,
  });
  assert.equal(fake.calls[0].args.model, "claude-haiku-5-5");
});

test("입력 오류는 400과 한국어 오류", async () => {
  const fake = fakeClient("x");
  const deps = { apiKey: "k", model: undefined, createClient: fake.createClient };
  const r1 = await handleDraftRequest(req("not json"), deps);
  assert.equal(r1.status, 400);
  const r2 = await handleDraftRequest(req({ inquiry: "", propertyData }), deps);
  assert.equal(r2.status, 400);
  assert.equal((await r2.json()).error, "고객 문의를 입력해 주세요.");
  assert.equal(fake.calls.length, 0);
});

test("API 오류는 이해하기 쉬운 한국어로 바꾼다", async () => {
  const cases: [number | undefined, RegExp][] = [
    [401, /키가 올바르지 않습니다/],
    [404, /모델을 찾을 수 없습니다/],
    [429, /잠시 제한/],
    [529, /일시적으로/],
    [undefined, /연결하지 못했습니다/],
  ];
  for (const [status, pattern] of cases) {
    const err = Object.assign(new Error("boom"), status === undefined ? {} : { status });
    const fake = fakeClient(err);
    const res = await handleDraftRequest(req({ inquiry: "안녕하세요", propertyData }), {
      apiKey: "k", model: undefined, createClient: fake.createClient,
    });
    assert.ok(res.status >= 500, String(status));
    assert.match((await res.json()).error, pattern);
  }
});

test("빈 답변이면 오류", async () => {
  const fake = fakeClient("   ");
  const res = await handleDraftRequest(req({ inquiry: "안녕하세요", propertyData }), {
    apiKey: "k", model: undefined, createClient: fake.createClient,
  });
  assert.equal(res.status, 502);
});
