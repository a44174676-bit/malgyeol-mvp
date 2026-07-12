import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCareRoleHome, getCurrentCareUser } from "@/lib/auth/care-session";

export const metadata: Metadata = {
  title: "말결 Care 로그인",
  description: "환자·보호자·언어재활사 전용 파일럿 로그인",
};

export default async function CareLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const currentUser = await getCurrentCareUser();
  if (currentUser) {
    redirect(getCareRoleHome(currentUser.role));
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-bold leading-tight">말결 Care 로그인</h1>
          <p className="text-xs text-ink-faint mt-1">
            환자·보호자·언어재활사 전용 파일럿 로그인입니다.
          </p>
        </div>

        <form action="/api/care/auth/login" method="POST" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" htmlFor="loginId">
              아이디
            </label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              required
              autoFocus
              autoComplete="username"
              className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-accent"
              placeholder="아이디 입력"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-2 focus:outline-accent"
              placeholder="비밀번호 입력"
            />
          </div>

          {error && (
            <p aria-live="polite" className="text-sm text-crit bg-crit-soft rounded-lg px-3 py-2">
              로그인 정보가 올바르지 않거나 사용할 수 없는 계정입니다.
            </p>
          )}

          <button
            type="submit"
            className="mt-1 bg-accent text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-accent-deep"
          >
            로그인
          </button>
        </form>

        <div className="mt-5 text-xs text-ink-faint leading-relaxed space-y-1.5">
          <p>실제 이름·전화번호 등 개인정보를 입력하지 마세요. 파일럿 테스트 전용 계정만 사용합니다.</p>
          <p>치료사 운영 로그인 페이지가 아닙니다. 치료사는 기존 /login을 이용해 주세요.</p>
        </div>
      </div>
    </main>
  );
}
