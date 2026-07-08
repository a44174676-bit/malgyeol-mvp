import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 8c1.5-3 2.5-3 4 0s2.5 3 4 0 2.5-3 4 0"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">말결</h1>
            <p className="text-xs text-ink-faint">언어치료 지원 플랫폼</p>
          </div>
        </div>
        <form action={login} className="flex flex-col gap-3">
          <label className="text-sm font-semibold" htmlFor="password">
            치료사 비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-accent"
            placeholder="비밀번호 입력"
          />
          {error && (
            <p className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2">
              비밀번호가 올바르지 않습니다.
            </p>
          )}
          <button
            type="submit"
            className="mt-1 bg-accent text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-accent-deep"
          >
            로그인
          </button>
        </form>
        <p className="mt-5 text-xs text-ink-faint leading-relaxed">
          보호자는 로그인 없이 치료사가 보내준 전용 링크로 접속합니다.
        </p>
        <a
          href="/demo"
          className="block mt-3 text-center text-xs font-semibold text-accent-deep hover:underline"
        >
          공개 데모 보기 →
        </a>
      </div>
    </main>
  );
}
