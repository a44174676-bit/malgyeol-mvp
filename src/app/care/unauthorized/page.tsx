import type { Metadata } from "next";
import Link from "next/link";
import { getCareRoleHome, getCurrentCareUser } from "@/lib/auth/care-session";

export const metadata: Metadata = {
  title: "말결 Care 접근 제한",
};

export default async function CareUnauthorizedPage() {
  const user = await getCurrentCareUser();

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-lg font-bold leading-tight mb-2">접근 권한이 없습니다</h1>
        <p className="text-sm text-ink-faint leading-relaxed mb-6">
          현재 계정 역할로는 이 페이지에 접근할 수 없습니다.
        </p>
        {user ? (
          <Link
            href={getCareRoleHome(user.role)}
            className="inline-block bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-accent-deep"
          >
            내 홈으로 이동
          </Link>
        ) : (
          <Link
            href="/care/login"
            className="inline-block bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-accent-deep"
          >
            로그인 화면으로 이동
          </Link>
        )}
      </div>
    </main>
  );
}
