import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Eyebrow, Pill, Avatar } from "@/components/ui";
import { KOREAN_SERVICE_LINE } from "@/lib/korean-copy";

export const dynamic = "force-dynamic";

export default async function KoreanLearnersPage() {
  const learners = await db.patient.findMany({
    where: { serviceLine: KOREAN_SERVICE_LINE },
    orderBy: { createdAt: "asc" },
    include: {
      prescriptions: { include: { items: true }, orderBy: { weekStart: "desc" }, take: 1 },
      submissions: { where: { reviewedAt: null } },
    },
  });

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-xl font-bold">학습자 목록</h1>
        <span className="text-xs text-ink-faint">
          데모 데이터는 npm run demo:add-korean 명령으로 재현합니다.
        </span>
      </div>
      <Card>
        <Eyebrow>등록 학습자 {learners.length}명</Eyebrow>
        <div className="flex flex-col gap-2">
          {learners.map((learner) => {
            const items = learner.prescriptions[0]?.items ?? [];
            const done = items.filter((item) => item.status === "DONE").length;
            return (
              <Link
                key={learner.id}
                href={`/korean/learners/${learner.id}`}
                className="border border-line rounded-xl px-4 py-3 flex items-center gap-3 hover:border-accent"
              >
                <Avatar name={learner.name} size="sm" color="bg-warm" />
                <div>
                  <p className="font-semibold text-sm">{learner.name}</p>
                  <p className="text-xs text-ink-faint">{learner.memo ?? "한국어 생활문장 연습"}</p>
                </div>
                <span className="ml-auto flex gap-2">
                  <Pill tone="teal">이번 주 {done}/{items.length}</Pill>
                  {learner.submissions.length > 0 && <Pill tone="warn">검수 대기 {learner.submissions.length}</Pill>}
                </span>
              </Link>
            );
          })}
          {learners.length === 0 && (
            <p className="text-sm text-ink-faint py-8 text-center">
              아직 Korean 데모 학습자가 없습니다. npm run demo:add-korean을 실행해 주세요.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

