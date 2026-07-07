import Link from "next/link";
import { db } from "@/lib/db";
import { weekStart } from "@/lib/dates";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { KOREAN_SERVICE_LINE } from "@/lib/korean-copy";

export const dynamic = "force-dynamic";

export default async function KoreanDashboard() {
  const ws = weekStart();
  const [learners, pending, weekItems, activities] = await Promise.all([
    db.patient.count({ where: { serviceLine: KOREAN_SERVICE_LINE } }),
    db.submission.count({
      where: { reviewedAt: null, patient: { serviceLine: KOREAN_SERVICE_LINE } },
    }),
    db.prescriptionItem.findMany({
      where: { prescription: { weekStart: ws, patient: { serviceLine: KOREAN_SERVICE_LINE } } },
    }),
    db.activity.count({ where: { serviceLine: KOREAN_SERVICE_LINE } }),
  ]);
  const done = weekItems.filter((item) => item.status === "DONE").length;
  const rate = weekItems.length ? Math.round((done / weekItems.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-xl font-bold">말결 Korean</h1>
          <p className="text-sm text-ink-soft mt-1">한국어 교사 / 튜터용 교육 MVP</p>
        </div>
        <Link href="/korean/learners" className="text-sm font-semibold text-accent-deep">
          학습자 목록 보기
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">학습자</p>
          <p className="text-3xl font-extrabold">{learners}</p>
        </Card>
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">교육용 과제</p>
          <p className="text-3xl font-extrabold">{activities}</p>
        </Card>
        <Link href="/korean/review" className="block">
          <Card className="h-full hover:border-accent transition-colors">
            <p className="text-[13px] text-ink-soft mb-1.5">검수 대기</p>
            <p className="text-3xl font-extrabold">{pending}</p>
          </Card>
        </Link>
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">이번 주 제출률</p>
          <p className="text-3xl font-extrabold">{rate}%</p>
        </Card>
      </div>
      <Card className="mt-5">
        <Eyebrow>Korean 흐름</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
          {["과제 제시", "녹음 제출", "발음 연습 참고지표", "교사 피드백", "발음 연습 리포트"].map((step) => (
            <div key={step} className="border border-line rounded-lg px-3 py-3">
              <Pill tone="teal">{step}</Pill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
