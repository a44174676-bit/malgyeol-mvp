import Link from "next/link";
import type { ReactNode } from "react";
import { KOREAN_NOTICE } from "@/lib/korean-copy";

const nav = [
  { href: "/korean", label: "Korean 대시보드" },
  { href: "/korean/learners", label: "학습자" },
  { href: "/korean/review", label: "교사/튜터 검수" },
];

export default function KoreanLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ground">
      <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-line p-5 hidden md:flex flex-col">
        <Link href="/korean" className="font-extrabold text-lg tracking-tight">
          말결 Korean
        </Link>
        <p className="text-xs text-ink-faint mt-1">한국어 생활문장 연습</p>
        <nav className="mt-8 flex flex-col gap-1.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-ink-soft hover:text-accent-deep rounded-lg px-3 py-2 hover:bg-accent-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-auto text-xs font-semibold text-ink-faint hover:text-accent-deep">
          말결 Care로 이동
        </Link>
      </aside>
      <main className="md:ml-56 p-4 sm:p-7 max-w-7xl">
        {children}
        <p className="text-[11px] text-ink-faint leading-relaxed mt-8 border-t border-line pt-3">
          {KOREAN_NOTICE}
        </p>
      </main>
    </div>
  );
}
