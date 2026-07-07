import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate, age } from "@/lib/dates";
import { parseMetrics, primaryMetric, DISCLAIMER } from "@/lib/metrics";
import { avgNumber, parseObservationMemo, parseReviewMeta } from "@/lib/training-data";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

// 특허 단계 ⑥ — 기간별 구음장애 홈 트레이닝 경과보고서 생성
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ weeks?: string }>;
}) {
  const { id } = await params;
  const { weeks: weeksRaw } = await searchParams;
  const weeks = weeksRaw === "4" ? 4 : 1;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - weeks * 7);

  const patient = await db.patient.findFirst({
    where: { id, serviceLine: "CARE" },
    include: {
      prescriptions: {
        where: { weekStart: { gte: new Date(start.getTime() - 6 * 86400000) } },
        include: { items: { include: { activity: true } } },
      },
      submissions: {
        where: { createdAt: { gte: start } },
        include: { item: { include: { activity: true } } },
        orderBy: { createdAt: "asc" },
      },
      observations: {
        where: { date: { gte: start } },
        orderBy: { date: "asc" },
      },
    },
  });
  if (!patient) notFound();

  const items = patient.prescriptions.flatMap((p) => p.items);
  const done = items.filter((i) => i.status === "DONE").length;
  const rate = items.length ? Math.round((done / items.length) * 100) : 0;
  const lowQ = patient.submissions.filter((s) => s.qualityFlag === "LOW").length;

  // 지표 변화: 과제 유형별 첫 값 vs 마지막 값
  const byKind = new Map<string, { label: string; unit: string; first: number; last: number }>();
  for (const s of patient.submissions) {
    const m = parseMetrics(s.metricsJson);
    if (!m) continue;
    const pm = primaryMetric(m);
    const key = `${m.kind}:${pm.label}`;
    const cur = byKind.get(key);
    if (!cur) byKind.set(key, { label: pm.label, unit: pm.unit, first: pm.value, last: pm.value });
    else cur.last = pm.value;
  }

  // 보호자 관찰 요약
  const obs = patient.observations;
  const obsMemos = obs.map((o) => ({ entry: o, memo: parseObservationMemo(o.memo) }));
  const famAvg = avgNumber(obs.map((o) => o.famIntel));
  const fatigueAvg = avgNumber(obs.map((o) => o.fatigue));
  const selfAvg = avgNumber(obs.map((o) => o.selfIntel));
  const conditionAvg = avgNumber(obsMemos.map((o) => o.memo.speechCondition));
  const coughCount = obs.filter((o) => o.cough && o.cough !== "없음").length;
  const tiredAfterSpeaking = obsMemos.filter((o) => o.memo.tiredAfterSpeaking && o.memo.tiredAfterSpeaking !== "아니오").length;
  const memos = obsMemos.filter((o) => o.memo.caregiverMemo).slice(-3);

  // 검수 의견 요약
  const opinions = patient.submissions.filter((s) => s.reviewOpinion);
  const opinionCounts = new Map<string, number>();
  opinions.forEach((s) => opinionCounts.set(s.reviewOpinion!, (opinionCounts.get(s.reviewOpinion!) ?? 0) + 1));
  const feedbacks = patient.submissions.filter((s) => s.feedback).slice(-3);
  const reviewMetas = patient.submissions
    .map((s) => ({ submission: s, meta: parseReviewMeta(s.reviewMetaJson) }))
    .filter((r) => r.meta);
  const errorSummary = new Map<string, number>();
  for (const r of reviewMetas) {
    for (const e of r.meta?.errorReviews ?? []) {
      if (e.action === "delete") continue;
      const label = `${e.errorType}(${e.action === "modify" ? "수정" : "확정"})`;
      errorSummary.set(label, (errorSummary.get(label) ?? 0) + 1);
    }
  }
  const storedNextTasks = reviewMetas
    .map((r) => r.meta?.nextTask)
    .filter((t): t is NonNullable<typeof t> => Boolean(t?.recommended && t.note))
    .slice(-5);
  const nextRecommendedTasks = [
    byKind.size === 0 && "이번 기간 제출된 녹음 기반 비진단 음성지표가 부족하므로 짧은 문장 읽기 1회부터 재개",
    lowQ > 0 && "녹음 품질 조건 미충족 기록이 있어 조용한 환경에서 최대연장발성 또는 짧은 문장 읽기 재제출",
    coughCount > 0 && "식사 중 사레/기침 보고가 있어 보호자 관찰 데이터 항목을 유지하고 필요 시 담당 전문가 확인",
    opinions.some((s) => s.reviewOpinion === "과제 난이도 조정 필요") && "치료사 검수 의견에 따라 문단 읽기보다 단어·짧은 문장 과제로 난이도 조정",
    opinions.some((s) => s.reviewOpinion === "재제출 필요") && "재제출 필요 과제는 동일 목표 발화로 1회 재시도 후 치료사 검수",
    "다음 처방은 홈 트레이닝 수행 이력, 비진단 음성지표, 보호자 관찰 데이터를 함께 확인해 담당 치료사가 결정",
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap print:hidden">
        <Link href={`/patients/${id}`} className="text-[13px] font-semibold text-accent-deep">
          ← 환자 상세로
        </Link>
        <span className="flex gap-2">
          <Link
            href={`/patients/${id}/report?weeks=1`}
            className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border ${weeks === 1 ? "bg-ink text-white border-ink" : "border-line text-ink-soft"}`}
          >
            주간
          </Link>
          <Link
            href={`/patients/${id}/report?weeks=4`}
            className={`text-xs font-semibold rounded-full px-3.5 py-1.5 border ${weeks === 4 ? "bg-ink text-white border-ink" : "border-line text-ink-soft"}`}
          >
            월간 (4주)
          </Link>
          <PrintButton />
        </span>
      </div>

      <div className="bg-white border border-line rounded-2xl p-8 print:border-0 print:p-0">
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">홈 트레이닝 경과보고서</h1>
            <p className="text-[13px] text-ink-soft mt-1">
              {patient.name} ({age(patient.birthYear)}, {patient.gender ?? "-"}) · {patient.diagnosis}
            </p>
          </div>
          <span className="text-xs bg-ground rounded-full px-3 py-1.5 font-semibold text-ink-soft">
            보고 기간: {fmtDate(start)} – {fmtDate(end)} ({weeks === 1 ? "주간" : "월간"})
          </span>
        </div>

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">
          1. 수행 요약 — 홈 트레이닝 수행 이력
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="border border-line rounded-lg py-3">
            <p className="text-xl font-extrabold tabular">{rate}%</p>
            <p className="text-[11px] text-ink-faint">과제 수행률 ({done}/{items.length})</p>
          </div>
          <div className="border border-line rounded-lg py-3">
            <p className="text-xl font-extrabold tabular">{patient.submissions.length}</p>
            <p className="text-[11px] text-ink-faint">녹음 제출 횟수</p>
          </div>
          <div className="border border-line rounded-lg py-3">
            <p className="text-xl font-extrabold tabular">{obs.length}</p>
            <p className="text-[11px] text-ink-faint">보호자 관찰 제출</p>
          </div>
          <div className="border border-line rounded-lg py-3">
            <p className="text-xl font-extrabold tabular">{lowQ}</p>
            <p className="text-[11px] text-ink-faint">품질 조건 미충족</p>
          </div>
        </div>

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">
          2. 비진단 음성지표 변화 <span className="text-[10px] font-semibold bg-ground text-ink-faint rounded-full px-2 py-0.5">참고지표</span>
        </h2>
        {byKind.size === 0 ? (
          <p className="text-[13px] text-ink-faint">기간 내 지표 데이터가 없습니다.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] text-ink-faint border-b border-line">
                <th className="py-1.5 font-semibold">지표</th>
                <th className="py-1.5 font-semibold">기간 첫 기록</th>
                <th className="py-1.5 font-semibold">기간 마지막 기록</th>
                <th className="py-1.5 font-semibold">변화</th>
              </tr>
            </thead>
            <tbody>
              {[...byKind.values()].map((k) => (
                <tr key={k.label} className="border-b border-line last:border-0">
                  <td className="py-2">{k.label}</td>
                  <td className="py-2 tabular">{k.first}{k.unit}</td>
                  <td className="py-2 tabular">{k.last}{k.unit}</td>
                  <td className="py-2 tabular font-semibold">
                    {k.last - k.first >= 0 ? "+" : ""}{Math.round((k.last - k.first) * 10) / 10}{k.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[11px] text-ink-faint mt-1.5">
          ※ 상대값 기반 측정으로 기기·환경에 따라 달라질 수 있으며, 수치 변화만으로 임상적 결론을 내리지 않습니다.
        </p>

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">
          3. 자가평가 변화와 보호자 관찰 데이터 요약
        </h2>
        {obs.length === 0 ? (
          <p className="text-[13px] text-ink-faint">기간 내 관찰 기록이 없습니다.</p>
        ) : (
          <div className="text-[13px] leading-relaxed">
            <p>
              {selfAvg !== null && <>오늘 말이 잘 나온 정도 평균 <b>{selfAvg}/5</b> · </>}
              {conditionAvg !== null && <>말하기 컨디션 평균 <b>{conditionAvg}/5</b> · </>}
              {famAvg !== null && <>보호자 이해도 평균 <b>{famAvg}/5</b> · </>}
              {fatigueAvg !== null && <>말하기 피로도 평균 <b>{fatigueAvg}/10</b> · </>}
              식사 중 사레/기침 보고 <b>{coughCount}건</b>
              {tiredAfterSpeaking > 0 && <> · 말한 후 피로 관찰 <b>{tiredAfterSpeaking}건</b></>}
              {coughCount > 0 && " (치료사 확인 필요)"}
            </p>
            {memos.length > 0 && (
              <ul className="mt-1.5 text-ink-soft list-disc pl-5">
                {memos.map((o) => (
                  <li key={o.entry.id}>{fmtDate(o.entry.date)} — {o.memo.caregiverMemo}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">
          4. 치료사 검수 의견과 오류 유형 확정 내역 요약
        </h2>
        {opinions.length === 0 && feedbacks.length === 0 && errorSummary.size === 0 ? (
          <p className="text-[13px] text-ink-faint">기간 내 검수 의견이 없습니다.</p>
        ) : (
          <div className="text-[13px] leading-relaxed">
            {opinionCounts.size > 0 && (
              <p>
                {[...opinionCounts.entries()].map(([k, v]) => `${k} ${v}건`).join(" · ")}
              </p>
            )}
            {errorSummary.size > 0 && (
              <p className="mt-1">
                오류 유형 확정 내역: {[...errorSummary.entries()].map(([k, v]) => `${k} ${v}건`).join(" · ")}
              </p>
            )}
            {feedbacks.length > 0 && (
              <ul className="mt-1.5 text-ink-soft list-disc pl-5">
                {feedbacks.map((s) => (
                  <li key={s.id}>{s.feedback}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <h2 className="text-sm font-bold mt-6 mb-2 pb-1.5 border-b-2 border-accent-soft">
          5. 다음 권장 과제
        </h2>
        <ul className="text-[13px] text-ink-soft leading-relaxed list-disc pl-5">
          {storedNextTasks.map((task) => (
            <li key={task.note}>치료사 검수 결과 기반 권장: {task.note}</li>
          ))}
          {nextRecommendedTasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
        <Link
          href={`/patients/${id}/prescribe`}
          className="inline-block mt-3 text-xs font-semibold text-accent-deep border border-accent-soft rounded-lg px-3 py-1.5 print:hidden"
        >
          홈프로그램 처방 화면에서 다음 과제 배정
        </Link>

        <div className="mt-8 pt-3 border-t border-line text-[11px] text-ink-faint leading-relaxed">
          {DISCLAIMER} 본 경과보고서의 모든 음성지표는 비진단 참고지표이며, 홈 트레이닝 수행 이력과
          보호자 관찰 데이터는 담당 전문가의 치료사 검수를 돕기 위한 정보입니다.
          <div className="flex justify-between mt-2 flex-wrap gap-2">
            <span>작성: 말결 경과보고서 생성 모듈 · {fmtDate(end)}</span>
            <span>말결 speech care — 치료사 검수 기반 구음장애 홈 트레이닝 시스템</span>
          </div>
        </div>
      </div>
    </div>
  );
}
