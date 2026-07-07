import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/dates";
import {
  parseMetrics, metricRows, primaryMetric, priorityScore,
  REVIEW_OPINIONS, DISCLAIMER,
} from "@/lib/metrics";
import { Card, Eyebrow, Pill, Avatar, judgmentLabel } from "@/components/ui";
import { judgeSubmission } from "./actions";

export const dynamic = "force-dynamic";

const ERROR_TYPE_CANDIDATES = ["생략", "대치", "왜곡", "반복", "쉼 증가", "목표 발화 일부 누락"];

function compactSpeech(text: string) {
  return text.replace(/[^\p{L}\p{N}가-힣]/gu, "");
}

function makeReferenceAnalysis(targetText: string | null, kind: string | null) {
  if (!targetText) {
    return {
      sttText: "자유발화 과제: 자동 전사 대신 치료사 청취 확인 필요",
      mismatches: ["목표 발화가 없는 과제입니다. 발화 내용은 치료사 확인 필요"],
      candidates: ["자유발화 내용 확인"],
    };
  }

  if (kind === "MPT") {
    return {
      sttText: "아",
      mismatches: ["연장발성 과제는 STT 문장 일치보다 발화 지속시간 확인 필요"],
      candidates: ["발성 지속시간 확인", "녹음 품질 확인"],
    };
  }

  if (kind === "DDK") {
    const syllable = targetText.slice(0, Math.min(3, targetText.length));
    return {
      sttText: `${syllable}…`,
      mismatches: ["반복 과제는 음절 순서와 규칙성을 치료사 확인 필요"],
      candidates: ["반복 순서 확인", "쉼 증가 여부 확인"],
    };
  }

  const normalized = compactSpeech(targetText);
  const sttText = normalized.length > 8
    ? `${normalized.slice(0, Math.max(3, normalized.length - 2))}`
    : normalized;
  const mismatches =
    normalized === compactSpeech(sttText)
      ? ["현재 더미 STT 후보에서 뚜렷한 불일치 후보 없음"]
      : [`목표 발화 끝부분 확인 필요: "${targetText}" ↔ "${sttText}"`];

  return {
    sttText,
    mismatches,
    candidates: normalized.length > compactSpeech(sttText).length
      ? ["목표 발화 일부 누락 후보", "말끝 약화/쉼 증가 후보"]
      : ["목표 발화 일치 여부 치료사 확인 필요"],
  };
}

export default async function ReviewPage() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const [pending, reviewed, riskObs, history] = await Promise.all([
    db.submission.findMany({
      where: { reviewedAt: null, patient: { serviceLine: "CARE" } },
      include: { patient: true, item: { include: { activity: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.submission.findMany({
      where: { reviewedAt: { not: null }, patient: { serviceLine: "CARE" } },
      include: { patient: true, item: { include: { activity: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
    }),
    db.observationEntry.findMany({
      where: { date: { gte: threeDaysAgo }, cough: { in: ["1-2회", "자주"] }, patient: { serviceLine: "CARE" } },
      select: { patientId: true },
    }),
    db.submission.findMany({
      where: { metricsJson: { not: null }, reviewedAt: { not: null }, patient: { serviceLine: "CARE" } },
      select: { patientId: true, createdAt: true, metricsJson: true, item: { select: { activityId: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);

  const riskPatients = new Set(riskObs.map((o) => o.patientId));

  // 기준값(동일 환자·동일 과제 최근 이력 평균) — 청구항 11의 정규화
  function baselineFor(patientId: string, activityId: string | undefined, before: Date): number | null {
    if (!activityId) return null;
    const vals = history
      .filter((h) => h.patientId === patientId && h.item?.activityId === activityId && h.createdAt < before)
      .slice(0, 5)
      .map((h) => {
        const m = parseMetrics(h.metricsJson);
        return m ? primaryMetric(m).value : null;
      })
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  const now = new Date().getTime();
  const ranked = pending
    .map((s) => {
      const m = parseMetrics(s.metricsJson);
      const baseline = m ? baselineFor(s.patientId, s.item?.activityId, s.createdAt) : null;
      const cur = m ? primaryMetric(m).value : null;
      const changeRatio =
        baseline !== null && baseline !== 0 && cur !== null
          ? (cur - baseline) / baseline
          : null;
      const risk = riskPatients.has(s.patientId);
      const score = priorityScore({
        riskObs: risk,
        changeRatio,
        hoursSinceSubmit: (now - s.createdAt.getTime()) / 3600000,
        lowQuality: s.qualityFlag === "LOW",
      });
      return { s, m, baseline, changeRatio, risk, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">치료사 검수</h1>
        <span className="flex gap-2">
          <Pill tone="teal">대기 {pending.length}건</Pill>
          <Pill tone="grey">위험 관찰·변화·대기시간 순 정렬</Pill>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          {ranked.length === 0 && (
            <Card>
              <p className="text-sm text-ink-faint py-6 text-center">
                검수할 제출물이 없습니다. 모두 처리하셨어요! 🎉
              </p>
            </Card>
          )}
          {ranked.map(({ s, m, baseline, changeRatio, risk }) => {
            const pm = m ? primaryMetric(m) : null;
            const aiRef = makeReferenceAnalysis(s.targetText, m?.kind ?? s.item?.activity.metricKind ?? null);
            return (
              <Card key={s.id}>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <Avatar name={s.patient.name} size="sm" />
                  <div>
                    <Link
                      href={`/patients/${s.patientId}`}
                      className="font-semibold text-[13.5px] hover:text-accent-deep"
                    >
                      {s.patient.name}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {s.item?.activity.title ?? "자유 제출"} · {fmtDateTime(s.createdAt)}
                    </p>
                  </div>
                  <span className="ml-auto flex gap-1.5 flex-wrap">
                    {risk && <Pill tone="crit">보호자 관찰: 사레/기침 보고</Pill>}
                    {s.qualityFlag === "LOW" && <Pill tone="warn">낮은 녹음 품질</Pill>}
                    {changeRatio !== null && Math.abs(changeRatio) >= 0.2 && (
                      <Pill tone="warn">지표 변화 {Math.round(changeRatio * 100)}%</Pill>
                    )}
                  </span>
                </div>

                {s.targetText && (
                  <div className="bg-ground border border-line rounded-lg px-3.5 py-2.5 mb-3">
                    <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-0.5">
                      목표 발화 {s.item?.activity.goalCondition && `· 목표 조건: ${s.item.activity.goalCondition}`}
                    </p>
                    <p className="text-[14px]">&ldquo;{s.targetText}&rdquo;</p>
                  </div>
                )}

                {s.audioPath ? (
                  <audio controls preload="none" src={`/api/audio/${s.id}`} className="w-full mb-3 h-10" />
                ) : (
                  <p className="text-xs text-ink-faint mb-3">녹음 파일 없음</p>
                )}

                {m && (
                  <div className="border border-line rounded-lg px-3.5 py-2.5 mb-3">
                    <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-1.5">
                      비진단 음성지표 (단말 산출) <Pill tone="grey">참고용</Pill>
                    </p>
                    <div className="grid grid-cols-2 gap-x-5">
                      {metricRows(m).map(([k, v]) => (
                        <p key={k} className="flex justify-between text-[12.5px] py-0.5 border-b border-line last:border-0">
                          <span className="text-ink-soft">{k}</span>
                          <b className="tabular">{v}</b>
                        </p>
                      ))}
                    </div>
                    {pm && baseline !== null && (
                      <p className="text-[12px] mt-2 text-accent-deep">
                        {pm.label} 기준값(최근 평균 {Math.round(baseline * 10) / 10}
                        {pm.unit}) 대비{" "}
                        <b>
                          {changeRatio !== null && changeRatio >= 0 ? "+" : ""}
                          {changeRatio !== null ? Math.round(changeRatio * 100) : 0}%
                        </b>{" "}
                        — 참고지표이며 해석은 치료사가 합니다
                      </p>
                    )}
                  </div>
                )}

                <form action={judgeSubmission.bind(null, s.id)}>
                  <input type="hidden" name="aiSttText" value={aiRef.sttText} />
                  {aiRef.mismatches.map((mismatch, idx) => (
                    <input key={`${mismatch}-${idx}`} type="hidden" name="aiMismatch" value={mismatch} />
                  ))}
                  <div className="border border-accent-soft bg-accent-soft/50 rounded-lg px-3.5 py-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <p className="text-[10.5px] font-bold tracking-widest text-accent-deep">
                        AI 참고 분석 Beta
                      </p>
                      <Pill tone="grey">참고 분석</Pill>
                      <Pill tone="warn">치료사 확인 필요</Pill>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12.5px]">
                      <div>
                        <p className="font-semibold text-ink mb-1">더미 STT 결과 후보</p>
                        <p className="bg-white border border-line rounded-md px-3 py-2 text-ink-soft">
                          {aiRef.sttText}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-ink mb-1">불일치 후보</p>
                        <ul className="bg-white border border-line rounded-md px-3 py-2 text-ink-soft list-disc pl-5">
                          {aiRef.mismatches.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-faint mt-2">
                      실제 STT API를 사용하지 않는 규칙 기반 예시입니다. 오류 유형은 치료사 검수 후 확정합니다.
                    </p>
                  </div>

                  <div className="border border-line rounded-lg px-3.5 py-3 mb-3">
                    <p className="text-[10.5px] font-bold tracking-widest text-ink-faint mb-2">
                      오류 유형 후보 · 확정/수정/삭제
                    </p>
                    <div className="flex flex-col gap-2">
                      {aiRef.candidates.map((candidate, idx) => (
                        <div key={`${candidate}-${idx}`} className="grid grid-cols-1 md:grid-cols-[1fr_8rem_8rem] gap-2 items-center">
                          <input
                            name={`errorCandidate-${idx}`}
                            defaultValue={candidate}
                            className="border border-line rounded-lg px-3 py-2 text-[13px]"
                            aria-label="오류 유형 후보 수정"
                          />
                          <select
                            name={`errorType-${idx}`}
                            className="border border-line rounded-lg px-2.5 py-2 text-[13px] bg-white"
                            defaultValue={ERROR_TYPE_CANDIDATES[idx % ERROR_TYPE_CANDIDATES.length]}
                            aria-label="오류 유형 선택"
                          >
                            {ERROR_TYPE_CANDIDATES.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <select
                            name={`errorAction-${idx}`}
                            className="border border-line rounded-lg px-2.5 py-2 text-[13px] bg-white"
                            defaultValue="confirm"
                            aria-label="오류 후보 처리"
                          >
                            <option value="confirm">확정</option>
                            <option value="modify">수정</option>
                            <option value="delete">삭제</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-ink-faint mt-2">
                      AI 참고 분석 Beta는 참고 후보로만 저장되며, 최종 오류 유형은 치료사 검수 결과로 저장됩니다.
                    </p>
                  </div>

                  <div className="flex gap-2 mb-2.5 flex-wrap">
                    <select
                      name="reviewOpinion"
                      className="border border-line rounded-lg px-2.5 py-2 text-[13px] bg-white flex-1 min-w-44"
                      defaultValue=""
                    >
                      <option value="">검수 의견 선택…</option>
                      {REVIEW_OPINIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    name="therapistMemo"
                    rows={2}
                    placeholder="치료사 검수 메모 (불일치 후보 확인, 오류 유형 수정 이유 등)"
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-y mb-2.5"
                  />
                  <div className="border border-line rounded-lg px-3.5 py-3 mb-3">
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft mb-2">
                      <input type="checkbox" name="nextTaskRecommended" value="true" defaultChecked />
                      다음 권장 과제 기록
                    </label>
                    <input
                      name="nextTaskNote"
                      defaultValue={
                        m?.kind === "MPT"
                          ? "최대연장발성 재시도 또는 짧은 문장 읽기 권장"
                          : m?.kind === "DDK"
                            ? "AMR/SMR 반복 과제와 짧은 문장 읽기 병행 권장"
                            : "짧은 문장 읽기 재시도 권장"
                      }
                      className="w-full border border-line rounded-lg px-3 py-2 text-[13px]"
                      aria-label="다음 권장 과제"
                    />
                    <p className="text-[11px] text-ink-faint mt-2">
                      실제 배정은 기존 홈프로그램 처방 화면에서 치료사가 수행합니다.
                    </p>
                  </div>
                  <textarea
                    name="feedback"
                    rows={2}
                    placeholder="보호자에게 보낼 피드백 또는 다음 연습 안내"
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm resize-y mb-2.5"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {s.targetText && !m && (
                      <>
                        <button type="submit" name="judgment" value="CORRECT"
                          className="flex-1 border-2 border-line rounded-lg py-2 text-[13px] font-semibold text-ink-soft hover:border-good hover:text-good hover:bg-good-soft">
                          정반응
                        </button>
                        <button type="submit" name="judgment" value="APPROX"
                          className="flex-1 border-2 border-line rounded-lg py-2 text-[13px] font-semibold text-ink-soft hover:border-warn hover:text-warn hover:bg-warn-soft">
                          왜곡 / 근사
                        </button>
                        <button type="submit" name="judgment" value="WRONG"
                          className="flex-1 border-2 border-line rounded-lg py-2 text-[13px] font-semibold text-ink-soft hover:border-crit hover:text-crit hover:bg-crit-soft">
                          오반응
                        </button>
                      </>
                    )}
                    <button type="submit"
                      className="flex-1 bg-accent text-white rounded-lg py-2 text-[13px] font-semibold hover:bg-accent-deep min-w-32">
                      검수 저장
                    </button>
                    <Link
                      href={`/patients/${s.patientId}/prescribe?fromSubmission=${s.id}&activity=${encodeURIComponent(s.item?.activity.title ?? s.targetText ?? "자유 제출")}`}
                      className="flex-1 text-center border border-accent text-accent-deep rounded-lg py-2 text-[13px] font-semibold hover:bg-accent-soft min-w-32"
                    >
                      다음 과제 배정
                    </Link>
                  </div>
                </form>
              </Card>
            );
          })}
        </div>

        <Card>
          <Eyebrow>최근 검수 완료</Eyebrow>
          {reviewed.length === 0 && (
            <p className="text-sm text-ink-faint py-2">아직 검수 이력이 없습니다.</p>
          )}
          {reviewed.map((s) => {
            const j = judgmentLabel(s.judgment);
            return (
              <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">
                    {s.patient.name}
                    <span className="font-normal text-ink-faint">
                      {" "}· {s.item?.activity.title ?? s.targetText ?? ""}
                    </span>
                  </p>
                  {s.reviewOpinion && (
                    <p className="text-xs text-accent-deep font-semibold">{s.reviewOpinion}</p>
                  )}
                  {s.feedback && (
                    <p className="text-xs text-ink-soft truncate">💬 {s.feedback}</p>
                  )}
                </div>
                <span className="ml-auto shrink-0">
                  {s.judgment ? <Pill tone={j.tone}>{j.text}</Pill> : <Pill tone="good">검수 완료</Pill>}
                </span>
              </div>
            );
          })}
        </Card>
      </div>

      <p className="text-[11px] text-ink-faint leading-relaxed mt-6 border-t border-line pt-3">
        {DISCLAIMER} 검수 우선순위는 확인 순서에 관한 정보일 뿐 진단이나 임상적 판단이 아닙니다.
      </p>
    </div>
  );
}
