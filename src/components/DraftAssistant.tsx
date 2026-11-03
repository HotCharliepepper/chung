"use client";

import Link from "next/link";
import { useState } from "react";
import { useStoredPropertyData } from "@/lib/useStoredPropertyData";
import { describeMasking, maskPersonalInfo } from "@/lib/mask";
import { MAX_INQUIRY_LENGTH, hasPropertyInfo } from "@/lib/draftPrompt";
import type { PropertyData } from "@/types/property";
import { Card, formatDateTime, inputClass, primaryButton, secondaryButton } from "./ui";

/** 브라우저에서만 그린다. (localStorage는 서버에 없음) */
export default function DraftAssistant() {
  const loaded = useStoredPropertyData();
  if (!loaded) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }
  if (!loaded.ok || !loaded.found || !hasPropertyInfo(loaded.data)) {
    return (
      <div className="mx-auto max-w-xl">
        <div
          role="alert"
          data-testid="missing-settings"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm"
        >
          <p className="text-base font-semibold">먼저 숙소 정보를 입력해 주세요.</p>
          <p>
            AI는 저장된 숙소 정보와 FAQ만 보고 답변을 만듭니다. 숙소 정보가 없으면 초안을 만들 수 없습니다.
            {!loaded.ok && " (저장된 정보를 불러오지 못했습니다.)"}
          </p>
          <Link href="/settings" className={`${primaryButton} self-start`}>
            숙소 정보 입력하러 가기
          </Link>
        </div>
      </div>
    );
  }
  return <DraftForm data={loaded.data} />;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 아래 예비 방법으로 시도
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function DraftForm({ data }: { data: PropertyData }) {
  const [inquiry, setInquiry] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskNotice, setMaskNotice] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const tooLong = inquiry.length > MAX_INQUIRY_LENGTH;

  async function handleGenerate() {
    setError(null);
    setCopyStatus("idle");
    if (inquiry.trim() === "") {
      setError("고객 문의를 입력해 주세요.");
      return;
    }
    if (tooLong) {
      setError(`고객 문의가 너무 깁니다. ${MAX_INQUIRY_LENGTH.toLocaleString("ko-KR")}자 이하로 줄여 주세요.`);
      return;
    }

    // 서버로 보내기 전에 브라우저에서 전화번호·이메일을 가린다.
    const maskResult = maskPersonalInfo(inquiry);
    setMaskNotice(describeMasking(maskResult));

    setLoading(true);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry: maskResult.masked,
          propertyData: { property: data.property, faqs: data.faqs },
        }),
      });
      let body: { draft?: unknown; error?: unknown } = {};
      try {
        body = await res.json();
      } catch {
        // JSON이 아닌 응답
      }
      if (!res.ok || typeof body.draft !== "string") {
        setError(
          typeof body.error === "string"
            ? body.error
            : "초안을 만들지 못했습니다. 잠시 뒤에 다시 시도해 주세요.",
        );
        return;
      }
      setDraft(body.draft);
    } catch {
      setError("서버에 연결하지 못했습니다. 터미널에서 npm run dev가 실행 중인지 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    const ok = await copyText(draft);
    setCopyStatus(ok ? "copied" : "failed");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div
        data-testid="property-panel"
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-lg" aria-hidden="true">
            🏠
          </span>
          <div>
            <p className="text-xs text-slate-500">사용 중인 숙소 정보</p>
            <p className="text-sm font-semibold text-slate-900">
              {data.property.name}
              <span className="ml-2 font-normal text-slate-500">FAQ {data.faqs.length}개 · 마지막 저장 {formatDateTime(data.updatedAt)}</span>
            </p>
          </div>
        </div>
        <Link href="/settings" className="text-sm font-medium text-indigo-600 hover:underline">
          숙소 정보 수정
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="고객 문의" description="받은 문의를 그대로 붙여넣으세요.">
          <div className="flex flex-col gap-3">
            <label htmlFor="inquiry" className="sr-only">
              고객 문의
            </label>
            <textarea
              id="inquiry"
              rows={12}
              className={`${inputClass} min-h-64 resize-y ${tooLong ? "border-red-500" : ""}`}
              placeholder="예: 안녕하세요, 아기랑 가는데 아기 침대 있을까요? 체크인은 몇 시부터인가요?"
              value={inquiry}
              onChange={(e) => {
                setInquiry(e.target.value);
                setMaskNotice(null);
              }}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>🔒 전화번호와 이메일은 AI에 보내기 전에 자동으로 가려집니다.</span>
              <span className={`shrink-0 ${tooLong ? "text-red-600" : ""}`}>
                {inquiry.length.toLocaleString("ko-KR")} / {MAX_INQUIRY_LENGTH.toLocaleString("ko-KR")}자
              </span>
            </div>
            <button type="button" onClick={handleGenerate} disabled={loading} className={`${primaryButton} self-start`}>
              {loading ? "초안 만드는 중…" : "초안 만들기"}
            </button>
            {loading && (
              <p role="status" className="text-sm text-slate-600">
                AI가 답변 초안을 만들고 있습니다. 보통 몇 초에서 30초 정도 걸립니다.
              </p>
            )}
            {maskNotice && (
              <p
                data-testid="mask-notice"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              >
                {maskNotice}
              </p>
            )}
            {error && (
              <p
                role="alert"
                data-testid="draft-error"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </div>
        </Card>

        <Card title="AI 답변 초안" description="직접 수정한 뒤 복사해서 사용하세요. 자동으로 보내지지 않습니다.">
          <div className="flex flex-col gap-3">
            <label htmlFor="draft" className="sr-only">
              답변 초안
            </label>
            <textarea
              id="draft"
              rows={12}
              className={`${inputClass} min-h-64 resize-y`}
              placeholder="초안 만들기를 누르면 여기에 답변 초안이 나옵니다."
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setCopyStatus("idle");
              }}
            />
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleCopy} disabled={draft.trim() === ""} className={secondaryButton}>
                복사
              </button>
              {copyStatus === "copied" && (
                <span role="status" className="text-sm font-medium text-emerald-700">
                  복사됨
                </span>
              )}
              {copyStatus === "failed" && (
                <span role="alert" className="text-sm text-red-600">
                  복사하지 못했습니다. 초안을 직접 선택해서 복사해 주세요.
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              AI 초안은 틀릴 수 있습니다. &quot;확인 후 안내드리겠습니다&quot; 부분은 직접 확인해서 채워 주세요. 문의와 초안은 어디에도 저장되지 않으며, 새로고침하면 사라집니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
