"use client";

// 저장된 숙소 정보를 화면에 보일 때마다 localStorage에서 다시 읽는다.
// (Next.js는 이동한 페이지 상태를 유지할 수 있어서, 한 번만 읽으면 저장 후에도 예전 값이 남을 수 있다.)
import { useMemo, useSyncExternalStore } from "react";
import { STORAGE_KEY, getBrowserStorage, loadPropertyData, type LoadResult } from "./propertyStorage";

const SERVER = "\u0000server";
const MISSING = "\u0000missing";
const UNAVAILABLE = "\u0000unavailable";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function readRaw(): string {
  const storage = getBrowserStorage();
  if (!storage) return UNAVAILABLE;
  try {
    return storage.getItem(STORAGE_KEY) ?? MISSING;
  } catch {
    return UNAVAILABLE;
  }
}

/** 서버 렌더링 중에는 null, 브라우저에서는 불러온 결과 */
export function useStoredPropertyData(): LoadResult | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  return useMemo(() => {
    if (raw === SERVER) return null;
    if (raw === UNAVAILABLE) return loadPropertyData(null);
    if (raw === MISSING) return loadPropertyData({ getItem: () => null, setItem: () => {} });
    return loadPropertyData({ getItem: () => raw, setItem: () => {} });
  }, [raw]);
}
