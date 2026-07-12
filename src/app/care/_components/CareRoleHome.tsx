import type { CareSessionUser } from "@/lib/auth/care-session";

const ROLE_LABELS: Record<CareSessionUser["role"], string> = {
  PATIENT: "환자",
  CAREGIVER: "보호자",
  THERAPIST: "언어재활사",
  ADMIN: "관리자",
};

export function CareRoleHome({
  user,
  title,
  notice,
}: {
  user: CareSessionUser;
  title: string;
  notice: string;
}) {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-line rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
          <p className="text-xs text-ink-faint mt-1">
            {user.displayName ?? "이름 미설정"} · {ROLE_LABELS[user.role]}
          </p>
        </div>

        <p className="text-sm text-ink-faint leading-relaxed mb-6">{notice}</p>

        <form action="/api/care/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full bg-line/60 text-ink rounded-lg py-2.5 text-sm font-semibold hover:bg-line"
          >
            로그아웃
          </button>
        </form>

        <p className="mt-5 text-xs text-ink-faint leading-relaxed">
          이 화면은 비진단 재활 지원 서비스입니다. 의료적 진단이나 처방을 대체하지 않습니다.
        </p>
      </div>
    </main>
  );
}
