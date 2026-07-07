import Link from "next/link";
import { logout } from "@/app/login/actions";
import { DISCLAIMER } from "@/lib/metrics";

const NAV = [
  { href: "/", label: "대시보드" },
  { href: "/patients", label: "환자 관리" },
  { href: "/assessments", label: "검사" },
  { href: "/activities", label: "활동 라이브러리" },
  { href: "/review", label: "치료사 검수" },
];

export default function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex min-h-screen">
      <aside className="w-52 shrink-0 bg-white border-r border-line p-4 flex flex-col gap-1">
        <Link href="/" className="flex items-center gap-2.5 px-2 pb-5 pt-1">
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 8c1.5-3 2.5-3 4 0s2.5 3 4 0 2.5-3 4 0"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span>
            <b className="text-base leading-none">말결</b>
            <span className="block text-[11px] text-ink-faint leading-tight">
              speech care
            </span>
          </span>
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] text-ink-soft hover:bg-accent-soft hover:text-accent-deep"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-3 border-t border-line px-2 flex items-center justify-between gap-2">
          <div className="text-xs">
            <b>윤선영 선생님</b>
            <span className="block text-ink-faint">1급 언어재활사</span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-[11px] text-ink-faint hover:text-crit border border-line rounded-md px-2 py-1"
            >
              로그아웃
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-7 min-w-0">
        {children}
        <p className="text-[11px] text-ink-faint leading-relaxed mt-8 border-t border-line pt-3">
          {DISCLAIMER}
        </p>
      </main>
    </div>
  );
}
