import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import { parseMetrics } from "@/lib/metrics";
import {
  KOREAN_SERVICE_LINE,
  koreanActionLabel,
  koreanMetricRows,
  parseKoreanJson,
  type KoreanReviewMeta,
} from "@/lib/korean-copy";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

function avg(values: (number | null | undefined)[]) {
  const nums = values.filter((value): value is number => typeof value === "number");
  return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
}

export default async function KoreanReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const learner = await db.patient.findUnique({
    where: { id, serviceLine: KOREAN_SERVICE_LINE },
    include: {
      prescriptions: { include: { items: { include: { activity: true } } } },
      submissions: { include: { item: { include: { activity: true } } }, orderBy: { createdAt: "asc" } },
      observations: { orderBy: { date: "asc" } },
    },
  });
  if (!learner) notFound();

  const items = learner.prescriptions.flatMap((prescription) => prescription.items);
  const done = items.filter((item) => item.status === "DONE").length;
  const rate = items.length ? Math.round((done / items.length) * 100) : 0;
  const confidence = avg(learner.observations.map((obs) => obs.selfIntel));
  const tiredness = avg(learner.observations.map((obs) => obs.fatigue));
  const metas = learner.submissions
    .map((submission) => ({ submission, meta: parseKoreanJson<KoreanReviewMeta>(submission.reviewMetaJson) }))
    .filter((item) => item.meta);
  const nextPractices = metas
    .map((item) => item.meta?.nextPractice?.note)
    .filter((note): note is string => Boolean(note));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4 print:hidden">
        <Link href={`/korean/learners/${learner.id}`} className="text-sm font-semibold text-accent-deep">
          학습자 상세로
        </Link>
        <PrintButton />
      </div>
      <div className="bg-white border border-line rounded-2xl p-8 print:border-0 print:p-0">
        <h1 className="text-xl font-bold">발음 연습 리포트</h1>
        <p className="text-sm text-ink-soft mt-1">{learner.name} · {fmtDate(new Date())}</p>

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">1. 한국어 생활문장 연습 이력</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="border border-line rounded-lg py-3"><b className="text-xl">{rate}%</b><p className="text-xs text-ink-faint">제출률</p></div>
          <div className="border border-line rounded-lg py-3"><b className="text-xl">{learner.submissions.length}</b><p className="text-xs text-ink-faint">녹음 제출</p></div>
          <div className="border border-line rounded-lg py-3"><b className="text-xl">{metas.length}</b><p className="text-xs text-ink-faint">교사 피드백</p></div>
        </div>

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">2. 발음 연습 참고지표</h2>
        {learner.submissions.map((submission) => {
          const metrics = parseMetrics(submission.metricsJson);
          if (!metrics) return null;
          return (
            <div key={submission.id} className="text-[13px] border-b border-line last:border-0 py-2">
              <p className="font-semibold">{submission.item?.activity.title ?? "제출 과제"}</p>
              <p className="text-ink-soft">
                {koreanMetricRows(metrics).slice(0, 4).map(([label, value]) => `${label} ${value}`).join(" · ")}
              </p>
            </div>
          );
        })}
        {learner.submissions.length === 0 && <p className="text-sm text-ink-faint">제출 이력이 없습니다.</p>}

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">3. 학습자 자기평가</h2>
        <p className="text-[13px] text-ink-soft">
          자신감 평균 {confidence ?? "-"} / 5 · 말하기 피로도 평균 {tiredness ?? "-"} / 10
        </p>

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">4. 교사 피드백과 확인 내용</h2>
        {metas.map(({ submission, meta }) => (
          <div key={submission.id} className="text-[13px] border-b border-line last:border-0 py-2">
            <p className="font-semibold">{submission.item?.activity.title ?? "제출 과제"}</p>
            {meta?.reference?.differences?.map((difference) => (
              <p key={difference} className="text-ink-soft">목표 문장과 다른 인식 후보: {difference}</p>
            ))}
            {meta?.pronunciationReviews?.map((review) => (
              <p key={`${review.candidate}-${review.focus}`} className="text-ink-soft">
                {review.focus}: {koreanActionLabel(review.action)}
              </p>
            ))}
            {submission.feedback && <p className="text-accent-deep">교사 피드백: {submission.feedback}</p>}
          </div>
        ))}
        {metas.length === 0 && <p className="text-sm text-ink-faint">아직 교사 피드백이 없습니다.</p>}

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">5. 다음 추천 연습</h2>
        <ul className="text-[13px] text-ink-soft list-disc pl-5">
          {(nextPractices.length ? nextPractices : ["이번 주 목표 문장 중 한 문장을 다시 천천히 읽기"]).map((practice) => (
            <li key={practice}>{practice}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
