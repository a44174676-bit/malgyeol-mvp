import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/dates";
import { parseMetrics } from "@/lib/metrics";
import { Card, Eyebrow, Pill, Avatar } from "@/components/ui";
import { KOREAN_SERVICE_LINE, koreanMetricRows } from "@/lib/korean-copy";
import { saveKoreanReview } from "../actions";

export const dynamic = "force-dynamic";

const FOCUS_OPTIONS = ["ㄹ", "ㅡ", "ㅓ/ㅗ", "받침", "된소리/거센소리", "문장 리듬"];

function compact(text: string) {
  return text.replace(/[^\p{L}\p{N}가-힣]/gu, "");
}

function reference(targetText: string | null) {
  if (!targetText) {
    return {
      heardText: "자유 발화 인식 후보",
      differences: ["목표 문장이 없는 과제입니다. 교사/튜터 확인이 필요합니다."],
      candidates: ["문장 흐름 확인"],
    };
  }
  const normalized = compact(targetText);
  const heardText = normalized.length > 8 ? normalized.slice(0, normalized.length - 2) : normalized;
  return {
    heardText,
    differences:
      heardText === normalized
        ? ["목표 문장과 다른 인식 후보가 뚜렷하지 않습니다."]
        : [`목표 문장 끝부분 확인: "${targetText}" / "${heardText}"`],
    candidates: ["목표 문장 끝부분", "받침", "문장 리듬"],
  };
}

export default async function KoreanReviewPage() {
  const [pending, reviewed] = await Promise.all([
    db.submission.findMany({
      where: { reviewedAt: null, patient: { serviceLine: KOREAN_SERVICE_LINE } },
      include: { patient: true, item: { include: { activity: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.submission.findMany({
      where: { reviewedAt: { not: null }, patient: { serviceLine: KOREAN_SERVICE_LINE } },
      include: { patient: true, item: { include: { activity: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-xl font-bold">교사/튜터 검수</h1>
        <Pill tone="teal">대기 {pending.length}건</Pill>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          {pending.map((submission) => {
            const metrics = parseMetrics(submission.metricsJson);
            const ref = reference(submission.targetText);
            return (
              <Card key={submission.id}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={submission.patient.name} size="sm" color="bg-warm" />
                  <div>
                    <Link href={`/korean/learners/${submission.patientId}`} className="font-semibold text-sm">
                      {submission.patient.name}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {submission.item?.activity.title ?? "제출 과제"} · {fmtDateTime(submission.createdAt)}
                    </p>
                  </div>
                </div>

                {submission.targetText && (
                  <div className="bg-ground border border-line rounded-lg px-3 py-2 mb-3">
                    <p className="text-[11px] font-bold tracking-widest text-ink-faint">목표 문장</p>
                    <p className="text-sm">&ldquo;{submission.targetText}&rdquo;</p>
                  </div>
                )}
                {submission.audioPath && (
                  <audio controls preload="none" src={`/api/audio/${submission.id}`} className="w-full h-10 mb-3" />
                )}
                {metrics && (
                  <div className="border border-line rounded-lg px-3 py-2 mb-3">
                    <p className="text-[11px] font-bold tracking-widest text-ink-faint mb-1">
                      발음 연습 참고지표
                    </p>
                    {koreanMetricRows(metrics).map(([label, value]) => (
                      <p key={label} className="flex justify-between text-xs py-0.5">
                        <span className="text-ink-soft">{label}</span>
                        <b>{value}</b>
                      </p>
                    ))}
                  </div>
                )}

                <form action={saveKoreanReview.bind(null, submission.id)}>
                  <input type="hidden" name="heardText" value={ref.heardText} />
                  {ref.differences.map((difference) => (
                    <input key={difference} type="hidden" name="difference" value={difference} />
                  ))}
                  <div className="border border-accent-soft bg-accent-soft/50 rounded-lg px-3 py-3 mb-3">
                    <p className="text-[11px] font-bold tracking-widest text-accent-deep mb-2">
                      목표 문장과 다른 인식 후보
                    </p>
                    <p className="text-xs text-ink-soft mb-2">규칙 기반 더미 참고: {ref.heardText}</p>
                    <ul className="list-disc pl-5 text-xs text-ink-soft">
                      {ref.differences.map((difference) => (
                        <li key={difference}>{difference}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-line rounded-lg px-3 py-3 mb-3">
                    <p className="text-[11px] font-bold tracking-widest text-ink-faint mb-2">
                      교사/튜터 확인
                    </p>
                    {ref.candidates.map((candidate, index) => (
                      <div key={candidate} className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_7rem] gap-2 mb-2">
                        <input name={`candidate-${index}`} defaultValue={candidate} className="border border-line rounded-lg px-3 py-2 text-sm" />
                        <select name={`focus-${index}`} defaultValue={FOCUS_OPTIONS[index]} className="border border-line rounded-lg px-2 py-2 text-sm bg-white">
                          {FOCUS_OPTIONS.map((focus) => <option key={focus} value={focus}>{focus}</option>)}
                        </select>
                        <select name={`action-${index}`} defaultValue="confirm" className="border border-line rounded-lg px-2 py-2 text-sm bg-white">
                          <option value="confirm">확인</option>
                          <option value="modify">수정</option>
                          <option value="delete">제외</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <textarea name="tutorMemo" rows={2} placeholder="튜터 메모" className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-y mb-2" />
                  <textarea name="feedback" rows={2} placeholder="학습자에게 보낼 교사 피드백" className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-y mb-2" />
                  <input name="nextPracticeNote" placeholder="다음 추천 연습" className="w-full border border-line rounded-lg px-3 py-2 text-sm mb-3" />
                  <button type="submit" className="w-full bg-accent text-white rounded-lg py-2 text-sm font-semibold">
                    교사 피드백 저장
                  </button>
                </form>
              </Card>
            );
          })}
          {pending.length === 0 && <Card><p className="text-sm text-ink-faint text-center py-6">검수 대기 제출물이 없습니다.</p></Card>}
        </div>

        <Card>
          <Eyebrow>최근 검수 완료</Eyebrow>
          {reviewed.map((submission) => (
            <div key={submission.id} className="border-b border-line last:border-0 py-2.5">
              <p className="text-sm font-semibold">{submission.patient.name}</p>
              <p className="text-xs text-ink-soft">{submission.item?.activity.title ?? "제출 과제"}</p>
              {submission.feedback && <p className="text-xs text-accent-deep mt-1">{submission.feedback}</p>}
            </div>
          ))}
          {reviewed.length === 0 && <p className="text-sm text-ink-faint">아직 저장된 교사 피드백이 없습니다.</p>}
        </Card>
      </div>
    </div>
  );
}

