"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 shrink-0" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/", label: "대시보드", icon: <Icon d="M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
  {
    href: "/draft",
    label: "문의 답변",
    icon: <Icon d="M4 5h16v11H8l-4 4V5zM8 9h8M8 12h5" />,
  },
  {
    href: "/settings",
    label: "숙소 정보",
    icon: <Icon d="M4 20V9l8-5 8 5v11M9 20v-6h6v6M4 20h16" />,
  },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "대시보드", subtitle: "숙소 정보 현황을 한눈에 확인하세요." },
  "/draft": { title: "문의 답변 만들기", subtitle: "고객 문의를 붙여넣고 AI 답변 초안을 확인·수정하세요." },
  "/settings": { title: "숙소 정보", subtitle: "AI가 답변할 때 근거로 쓰는 정보와 FAQ입니다." },
};

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</span>
      <span className="text-base font-bold tracking-tight text-slate-900">StayMind AI</span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="주 메뉴">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const meta = PAGE_META[pathname] ?? { title: "StayMind AI", subtitle: "" };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* 데스크톱 사이드바 */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Logo />
        <div className="mt-8">
          <NavLinks pathname={pathname} />
        </div>
        <p className="mt-auto rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          AI 초안은 자동으로 보내지지 않아요. 항상 확인 후 직접 복사해서 사용하세요.
        </p>
      </aside>

      {/* 모바일 서랍 메뉴 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative flex h-full w-64 flex-col bg-white px-4 py-5 shadow-xl">
            <Logo />
            <div className="mt-8">
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 모바일 상단 바 */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Icon d="M4 6h16M4 12h16M4 18h16" />
          </button>
        </div>

        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{meta.title}</h1>
          {meta.subtitle && <p className="mt-1 text-sm text-slate-500">{meta.subtitle}</p>}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
