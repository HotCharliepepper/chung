"use client";

import Link from "next/link";
import { useStoredPropertyData } from "@/lib/useStoredPropertyData";
import { FIELD_LABELS, hasPropertyInfo } from "@/lib/draftPrompt";
import { summarizeProperty } from "@/lib/propertySummary";
import type { PropertyData } from "@/types/property";
import { Card, formatDateTime, primaryButton, secondaryButton } from "./ui";

export default function Dashboard() {
  const loaded = useStoredPropertyData();
  if (!loaded) return <p className="text-sm text-slate-500">불러오는 중…</p>;
  if (!loaded.ok || !loaded.found || !hasPropertyInfo(loaded.data)) {
    return <EmptyState loadFailed={!loaded.ok} />;
  }
  return <Overview data={loaded.data} />;
}

function EmptyState({ loadFailed }: { loadFailed: boolean }) {
  return (
    <div className="mx-auto max-w-xl" data-testid="dashboard-empty">
      <Card>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-2xl" aria-hidden="true">
            🏠
          </span>
          <div>
            <h2 className="text-lg font-semibold">아직 저장된 숙소 정보가 없어요</h2>
            <p className="mt-1 text-sm text-slate-500">
              숙소 정보와 FAQ를 먼저 입력하면, AI가 그 내용만 근거로 문의 답변 초안을 만들어 드려요.
              {loadFailed && " (저장된 정보를 불러오지 못했습니다.)"}
            </p>
          </div>
          <Link href="/settings" className={primaryButton}>
            숙소 정보 입력하기
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="w-28 shrink-0 text-xs font-medium text-slate-500 sm:text-sm">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function Missing() {
  return <span className="text-slate-400">미입력</span>;
}

function short(text: string, max = 80): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

function Overview({ data }: { data: PropertyData }) {
  const summary = summarizeProperty(data);
  const p = data.property;
  const wifiFilled = p.wifi.trim() !== "";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6" data-testid="dashboard">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="숙소 요약"
          description="이 브라우저에 저장된 정보입니다."
          action={
            <Link href="/settings" className="text-sm font-medium text-indigo-600 hover:underline">
              수정
            </Link>
          }
        >
          <p className="text-xl font-bold tracking-tight" data-testid="summary-name">
            {p.name}
          </p>
          <dl className="mt-2">
            <Row label="체크인">{p.checkIn.trim() ? short(p.checkIn) : <Missing />}</Row>
            <Row label="체크아웃">{p.checkOut.trim() ? short(p.checkOut) : <Missing />}</Row>
            <Row label="주차">{p.parking.trim() ? short(p.parking) : <Missing />}</Row>
            <Row label="와이파이">
              <span
                data-testid="wifi-status"
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  wifiFilled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {wifiFilled ? "입력됨" : "미입력"}
              </span>
            </Row>
            <Row label="FAQ">{summary.faqCount}개</Row>
            <Row label="마지막 저장">{formatDateTime(data.updatedAt)}</Row>
          </dl>
        </Card>

        <Card title="정보 완성도" description="숙소 정보 9개 항목 중 입력된 항목">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tight" data-testid="completeness">
              {summary.filledCount}
            </span>
            <span className="pb-1 text-sm text-slate-500">/ {summary.totalCount}개 입력</span>
          </div>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={summary.totalCount}
            aria-valuenow={summary.filledCount}
            aria-label="정보 완성도"
          >
            <div
              className={`h-full rounded-full ${summary.percent === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${summary.percent}%` }}
            />
          </div>
          {summary.missingKeys.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-700">모든 항목이 입력되어 있어요.</p>
          ) : (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">비어 있는 항목</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {summary.missingKeys.map((k) => (
                  <li key={k} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                    {FIELD_LABELS[k]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            비어 있는 내용을 물어보면 AI는 &quot;확인 후 안내드리겠습니다&quot;라고 답해요.
          </p>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <QuickAction
          href="/draft"
          title="문의 답변 만들기"
          body="고객 문의를 붙여넣으면 저장된 정보로 답변 초안을 만들어요."
          cta="시작하기"
          primary
        />
        <QuickAction
          href="/settings"
          title="숙소 정보 수정"
          body="체크인, 주차, 이용 규칙, FAQ 등을 고치거나 추가해요."
          cta="수정하기"
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  body,
  cta,
  primary,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-slate-500">{body}</p>
      <span className={`${primary ? primaryButton : secondaryButton} self-start`}>{cta} →</span>
    </Link>
  );
}
