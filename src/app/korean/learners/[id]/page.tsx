import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate, weekStart } from "@/lib/dates";
import { Card, Eyebrow, Pill } from "@/components/ui";
import {
  KOREAN_SERVICE_LINE,
  koreanActionLabel,
  koreanMetricRows,
  parseKoreanJson,
  type KoreanReviewMeta,
} from "@/lib/korean-copy";
import { parseMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

function parseMemo(memo: string | null) {
  return parseKoreanJson<{ difficulty?: number; memo?: string }>(memo) ?? {};
}

export default async function KoreanLearnerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const learner = await db.patient.findUnique({
    where: { id, serviceLine: KOREAN_SERVICE_LINE },
    include: {
      prescriptions: {
        where: { weekStart: weekStart() },
        include: { items: { include: { activity: true } } },
      },
      submissions: {
        include: { item: { include: { activity: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      observations: { orderBy: { date: "asc" }, take: 12 },
    },
  });
  if (!learner) notFound();

  const currentItems = learner.prescriptions[0]?.items ?? [];
  const recentReviews = learner.submissions
    .map((submission) => ({
      submission,
      meta: parseKoreanJson<KoreanReviewMeta>(submission.reviewMetaJson),
    }))
    .filter((item) => item.meta);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold">{learner.name}</h1>
          <p className="text-sm text-ink-soft mt-1">학습자 상세 · 한국어 생활문장 연습</p>
        </div>
        <span className="flex gap-2 flex-wrap">
          <Link href={`/korean/portal/${learner.portalToken}`} className="text-xs font-semibold border border-line rounded-lg px-3 py-2">
            학습자 포털
          </Link>
          <Link href={`/korean/learners/${learner.id}/assign`} className="text-xs font-semibold bg-accent text-white rounded-lg px-3 py-2">
            발음 과제 배정
          </Link>
          <Link href={`/korean/learners/${learner.id}/report`} className="text-xs font-semibold border border-line rounded-lg px-3 py-2">
            발음 연습 리포트
          </Link>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <Eyebrow>이번 주 과제</Eyebrow>
          {currentItems.map((item) => (
            <div key={item.id} className="border-b border-line last:border-0 py-2.5">
              <p className="text-sm font-semibold">{item.activity.title}</p>
              <p className="text-xs text-ink-soft">&ldquo;{item.activity.targetText}&rdquo;</p>
              <Pill tone={item.status === "DONE" ? "good" : "grey"}>{item.status === "DONE" ? "제출 완료" : "대기"}</Pill>
            </div>
          ))}
          {currentItems.length === 0 && <p className="text-sm text-ink-faint">배정된 과제가 없습니다.</p>}
        </Card>

        <Card>
          <Eyebrow>학습자 자기평가 추이</Eyebrow>
          {learner.observations.map((obs) => {
            const memo = parseMemo(obs.memo);
            return (
              <p key={obs.id} className="text-[13px] border-b border-line last:border-0 py-2">
                {fmtDate(obs.date)} · 자신감 {obs.selfIntel ?? "-"} · 피로도 {obs.fatigue ?? "-"}
                {memo.difficulty ? ` · 어려움 ${memo.difficulty}` : ""}
              </p>
            );
          })}
          {learner.observations.length === 0 && <p className="text-sm text-ink-faint">아직 자기평가가 없습니다.</p>}
        </Card>

        <Card>
          <Eyebrow>최근 발음 연습 참고지표</Eyebrow>
          {learner.submissions.slice(0, 4).map((submission) => {
            const metrics = parseMetrics(submission.metricsJson);
            return (
              <div key={submission.id} className="border-b border-line last:border-0 py-2.5">
                <p className="text-sm font-semibold">{submission.item?.activity.title ?? "제출 과제"}</p>
                {metrics ? (
                  <div className="mt-1">
                    {koreanMetricRows(metrics).slice(0, 3).map(([label, value]) => (
                      <p key={label} className="text-xs text-ink-soft">{label}: {value}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-faint">참고지표 없음</p>
                )}
              </div>
            );
          })}
        </Card>

        <Card>
          <Eyebrow>최근 교사 피드백</Eyebrow>
          {recentReviews.slice(0, 4).map(({ submission, meta }) => (
            <div key={submission.id} className="border-b border-line last:border-0 py-2.5">
              <p className="text-sm font-semibold">{submission.item?.activity.title ?? "제출 과제"}</p>
              {meta?.reference?.differences?.[0] && (
                <p className="text-xs text-ink-soft">목표 문장과 다른 인식 후보: {meta.reference.differences[0]}</p>
              )}
              {meta?.pronunciationReviews?.map((review) => (
                <p key={`${review.candidate}-${review.focus}`} className="text-xs text-ink-soft">
                  {review.focus} · {koreanActionLabel(review.action)}
                </p>
              ))}
              {submission.feedback && <p className="text-xs text-accent-deep mt-1">교사 피드백: {submission.feedback}</p>}
            </div>
          ))}
          {recentReviews.length === 0 && <p className="text-sm text-ink-faint">아직 검수 결과가 없습니다.</p>}
        </Card>
      </div>
    </div>
  );
}
