"use client";

import { useState, useSyncExternalStore } from "react";
import type { FaqItem, PropertyInfo } from "@/types/property";
import {
  createFaqId,
  getBrowserStorage,
  loadPropertyData,
  savePropertyData,
} from "@/lib/propertyStorage";
import { SAMPLE_FAQS, SAMPLE_PROPERTY } from "@/data/sampleProperty";
import { Card, formatDateTime, inputClass, primaryButton, secondaryButton } from "./ui";

const noopSubscribe = () => () => {};

/** 브라우저에서만 폼을 그린다. (localStorage는 서버에 없음) */
export default function PropertySettings() {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!isClient) {
    return <p className="text-sm text-slate-500">불러오는 중…</p>;
  }
  return <PropertyForm />;
}

type FieldDef = {
  key: keyof PropertyInfo;
  label: string;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
  rows?: number;
};

const FIELDS: FieldDef[] = [
  { key: "name", label: "숙소 이름", placeholder: "예: 세한 스테이", required: true },
  {
    key: "location",
    label: "위치·찾아오는 길",
    placeholder: "예: 제주시 ○○읍, 버스 정류장에서 도보 5분",
    multiline: true,
    rows: 4,
  },
  { key: "checkIn", label: "체크인 시간", placeholder: "예: 15:00", multiline: true, rows: 3 },
  { key: "checkOut", label: "체크아웃 시간", placeholder: "예: 11:00", multiline: true, rows: 3 },
  { key: "parking", label: "주차 안내", placeholder: "예: 숙소 앞 무료 주차 1대 가능", multiline: true },
  { key: "wifi", label: "와이파이 안내", placeholder: "예: 객실 내 무료 와이파이", multiline: true },
  { key: "amenities", label: "편의시설", placeholder: "예: 세탁기, 전자레인지, 아기 침대 1개", multiline: true, rows: 6 },
  {
    key: "rules",
    label: "이용 규칙 (흡연, 반려동물, 소음 등)",
    placeholder: "예: 실내 금연, 반려동물 동반 불가, 22시 이후 소음 자제",
    multiline: true,
    rows: 6,
  },
  { key: "notes", label: "기타 안내사항", placeholder: "예: 얼리 체크인은 당일 상황에 따라 안내", multiline: true, rows: 4 },
];

const FIELD_GROUPS: { title: string; description: string; keys: (keyof PropertyInfo)[] }[] = [
  { title: "기본 정보", description: "숙소 이름과 위치", keys: ["name", "location"] },
  { title: "체크인·체크아웃", description: "입실과 퇴실 시간", keys: ["checkIn", "checkOut"] },
  { title: "시설 안내", description: "주차, 와이파이, 편의시설", keys: ["parking", "wifi", "amenities"] },
  { title: "규칙·기타", description: "이용 규칙과 기타 안내", keys: ["rules", "notes"] },
];

type Status =
  | { kind: "idle" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string }
  | { kind: "sampleLoaded" };

const formatTime = (iso: string) => formatDateTime(iso);

function PropertyForm() {
  // 컴포넌트가 브라우저에서 처음 그려질 때 한 번만 localStorage에서 읽는다.
  const [initial] = useState(() => loadPropertyData(getBrowserStorage()));
  const [property, setProperty] = useState<PropertyInfo>(initial.data.property);
  const [faqs, setFaqs] = useState<FaqItem[]>(initial.data.faqs);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initial.data.updatedAt);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const loadError = initial.ok ? null : initial.error;

  const nameMissing = status.kind === "error" && property.name.trim() === "";

  function updateField(key: keyof PropertyInfo, value: string) {
    setProperty((prev) => ({ ...prev, [key]: value }));
    setStatus({ kind: "idle" });
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { id: createFaqId(), question: "", answer: "" }]);
    setStatus({ kind: "idle" });
  }

  function updateFaq(id: string, patch: Partial<Omit<FaqItem, "id">>) {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setStatus({ kind: "idle" });
  }

  function removeFaq(id: string) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setStatus({ kind: "idle" });
  }

  function hasAnyInput(): boolean {
    return (
      Object.values(property).some((v) => v.trim() !== "") ||
      faqs.some((f) => f.question.trim() !== "" || f.answer.trim() !== "")
    );
  }

  /** 예시 숙소를 폼에 채운다. 저장은 하지 않는다. (운영자가 저장 버튼을 눌러야 저장됨) */
  function loadSample() {
    if (
      hasAnyInput() &&
      !window.confirm("지금 입력된 내용이 예시 숙소 내용으로 바뀝니다. 계속할까요? (저장 버튼을 누르기 전까지는 저장되지 않습니다)")
    ) {
      return;
    }
    setProperty({ ...SAMPLE_PROPERTY });
    setFaqs(SAMPLE_FAQS.map((f) => ({ id: createFaqId(), ...f })));
    setStatus({ kind: "sampleLoaded" });
  }

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = savePropertyData(getBrowserStorage(), {
      version: 1,
      property,
      faqs,
      updatedAt: lastSavedAt,
    });
    if (result.ok) {
      setFaqs(result.data.faqs);
      setLastSavedAt(result.data.updatedAt);
      setStatus({ kind: "saved", at: result.data.updatedAt ?? "" });
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  const fieldByKey = (key: keyof PropertyInfo) => FIELDS.find((f) => f.key === key)!;

  function renderField(field: FieldDef) {
    const id = `field-${field.key}`;
    const invalid = field.required && nameMissing;
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {field.label}
          {field.required && <span className="ml-1 text-red-600">*</span>}
        </label>
        {field.multiline ? (
          <textarea
            id={id}
            rows={field.rows ?? 2}
            className={inputClass}
            placeholder={field.placeholder}
            value={property[field.key]}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
        ) : (
          <input
            id={id}
            type="text"
            className={`${inputClass} ${invalid ? "border-red-500" : ""}`}
            placeholder={field.placeholder}
            value={property[field.key]}
            aria-invalid={invalid || undefined}
            aria-required={field.required || undefined}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} noValidate className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-indigo-900">
          이 정보만을 근거로 AI가 답변 초안을 만듭니다. 고객 이름·연락처 같은 개인정보는 입력하지 마세요.
        </p>
        <button type="button" onClick={loadSample} className={`${secondaryButton} shrink-0`}>
          예시 숙소 불러오기
        </button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {loadError}
        </p>
      )}

      {FIELD_GROUPS.map((group) => (
        <Card key={group.title} title={group.title} description={group.description}>
          <div className={`grid gap-4 ${group.keys.length === 2 && group.title === "체크인·체크아웃" ? "sm:grid-cols-2" : ""}`}>
            {group.keys.map((key) => renderField(fieldByKey(key)))}
          </div>
        </Card>
      ))}

      <Card
        title="자주 묻는 질문 (FAQ)"
        description={`${faqs.length}개 · 질문과 답변이 모두 빈 FAQ는 저장할 때 빠집니다.`}
        action={
          <button type="button" onClick={addFaq} className={secondaryButton}>
            FAQ 추가
          </button>
        }
      >
        {faqs.length === 0 && (
          <p className="text-sm text-slate-500">등록된 FAQ가 없습니다. &quot;FAQ 추가&quot; 버튼으로 질문과 답변을 추가하세요.</p>
        )}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">FAQ {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFaq(faq.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  삭제
                </button>
              </div>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                질문
                <input
                  type="text"
                  className={inputClass}
                  placeholder="예: 아기 침대 있나요?"
                  value={faq.question}
                  onChange={(e) => updateFaq(faq.id, { question: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                답변
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder="예: 아기 침대 1개를 무료로 빌려드립니다. 미리 말씀해 주세요."
                  value={faq.answer}
                  onChange={(e) => updateFaq(faq.id, { answer: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      </Card>

      <div
        data-testid="save-bar"
        className="sticky bottom-4 z-20 flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 shadow-lg backdrop-blur"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={primaryButton}>
            저장
          </button>
          {status.kind === "saved" && (
            <span role="status" className="text-sm font-medium text-emerald-700">
              저장되었습니다 ({formatTime(status.at)})
            </span>
          )}
          {status.kind === "sampleLoaded" && (
            <span role="status" className="text-sm font-medium text-indigo-700">
              예시 숙소를 불러왔습니다. 저장 버튼을 눌러야 저장됩니다.
            </span>
          )}
          {status.kind === "idle" && lastSavedAt && (
            <span className="text-sm text-slate-500">마지막 저장: {formatTime(lastSavedAt)}</span>
          )}
          {status.kind === "error" && (
            <span role="alert" className="text-sm text-red-600">
              {status.message}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">내용은 이 브라우저(localStorage)에만 저장되며 서버로 보내지 않습니다.</p>
      </div>
    </form>
  );
}
