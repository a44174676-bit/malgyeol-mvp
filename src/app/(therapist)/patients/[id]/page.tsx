import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { weekStart, fmtDate, fmtDateTime, age, DAY_LABELS } from "@/lib/dates";
import { Card, Eyebrow, Pill, Avatar, ProgressBar } from "@/components/ui";
import { AccuracyChart } from "@/components/AccuracyChart";
import { TrendChart } from "@/components/TrendChart";
import { parseMetrics, primaryMetric } from "@/lib/metrics";
import { parseObservationMemo, parseReviewMeta } from "@/lib/training-data";
import { addGoal, addSessionNote, setGoalStatus } from "../actions";
import { addStandardScore } from "../../assessments/actions";
import { STANDARD_TESTS } from "@/lib/words";
import { DeletePatientButton } from "./DeletePatientButton";

export const dynamic = "force-dynamic";

export default async function PatientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await db.patient.findFirst({
    where: { id, serviceLine: "CARE" },
    include: {
      goals: { orderBy: { order: "asc" } },
      sessions: { orderBy: { date: "asc" } },
      prescriptions: {
        where: { weekStart: weekStart() },
        include: { items: { include: { activity: true } } },
      },
      articulationTests: { orderBy: { date: "desc" }, take: 5 },
      dysarthriaTests: { orderBy: { date: "desc" }, take: 5 },
      standardScores: { orderBy: { date: "desc" }, take: 8 },
      submissions: {
        where: {
          OR: [
            { metricsJson: { not: null } },
            { reviewedAt: { not: null } },
            { reviewMetaJson: { not: null } },
          ],
        },
        include: { item: { include: { activity: true } } },
        orderBy: { createdAt: "asc" },
        take: 60,
      },
      observations: { orderBy: { date: "asc" }, take: 30 },
    },
  });
  if (!patient) notFound();

  // 비진단 음성지표 시계열 (특허 단계 ④)
  const trendsByKind = new Map<string, { label: string; unit: string; points: { label: string; value: number }[] }>();
  for (const s of patient.submissions) {
    const m = parseMetrics(s.metricsJson);
    if (!m) continue;
    const pm = primaryMetric(m);
    const key = m.kind;
    if (!trendsByKind.has(key)) trendsByKind.set(key, { label: pm.label, unit: pm.unit, points: [] });
    trendsByKind.get(key)!.points.push({ label: fmtDate(s.createdAt), value: pm.value });
  }
  const obsTrend = patient.observations
    .filter((o) => o.famIntel !== null)
    .map((o) => ({ label: fmtDate(o.date), value: o.famIntel! }));
  const fatigueTrend = patient.observations
    .filter((o) => o.fatigue !== null)
    .map((o) => ({ label: fmtDate(o.date), value: o.fatigue! }));
  const selfIntelTrend = patient.observations
    .filter((o) => o.selfIntel !== null)
    .map((o) => ({ label: fmtDate(o.date), value: o.selfIntel! }));
  const conditionTrend = patient.observations
    .map((o) => ({ date: o.date, memo: parseObservationMemo(o.memo) }))
    .filter((o) => typeof o.memo.speechCondition === "number")
    .map((o) => ({ label: fmtDate(o.date), value: o.memo.speechCondition! }));
  const recentReviewed = [...patient.submissions]
    .filter((s) => s.reviewedAt || s.reviewMetaJson)
    .sort((a, b) => (b.reviewedAt ?? b.createdAt).getTime() - (a.reviewedAt ?? a.createdAt).getTime())
    .slice(0, 5);

  const longGoals = patient.goals.filter((g) => g.kind === "LONG");
  const shortGoals = patient.goals.filter((g) => g.kind === "SHORT");
  const chartPoints = patient.sessions
    .filter((s) => s.accuracy !== null)
    .slice(-8)
    .map((s) => ({ label: fmtDate(s.date), value: s.accuracy! }));
  const recentSessions = [...patient.sessions].reverse().slice(0, 4);
  const rx = patient.prescriptions[0];

  const goalStatusPill = (status: string) =>
    status === "MET" ? (
      <Pill tone="good">준거 도달</Pill>
    ) : status === "PENDING" ? (
      <Pill tone="grey">대기</Pill>
    ) : (
      <Pill tone="teal">진행 중</Pill>
    );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Avatar name={patient.name} size="lg" color="bg-accent" />
        <div className="min-w-0">
          <h1 className="text-xl font-bold">
            {patient.name}{" "}
            <span className="text-sm font-medium text-ink-soft">
              {age(patient.birthYear)} {patient.gender ?? ""}
            </span>
          </h1>
          <p className="text-[13px] text-ink-soft">
            {patient.diagnosis}
            {patient.memo ? ` · ${patient.memo}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <DeletePatientButton patientId={patient.id} name={patient.name} />
          <Link
            href={`/patients/${patient.id}/report?weeks=1`}
            className="text-[13px] font-semibold border border-line rounded-lg px-3.5 py-2 hover:border-accent hover:text-accent-deep"
          >
            경과보고서
          </Link>
          <Link
            href={`/portal/${patient.portalToken}`}
            target="_blank"
            className="text-[13px] font-semibold border border-line rounded-lg px-3.5 py-2 hover:border-accent hover:text-accent-deep"
          >
            보호자 포털 열기 ↗
          </Link>
          <Link
            href={`/patients/${patient.id}/prescribe`}
            className="text-[13px] font-semibold bg-accent text-white rounded-lg px-3.5 py-2 hover:bg-accent-deep"
          >
            홈프로그램 처방
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <Eyebrow>치료 목표</Eyebrow>
            {longGoals.map((g) => (
              <div
                key={g.id}
                className="bg-accent-soft text-accent-deep rounded-lg px-3.5 py-2.5 text-[13px] mb-3"
              >
                <b className="block text-[10.5px] tracking-widest opacity-75 mb-0.5">
                  장기목표
                </b>
                {g.title}
              </div>
            ))}
            {shortGoals.map((g, i) => (
              <div key={g.id} className="py-3 border-b border-line last:border-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-[13.5px]">
                    단기 {i + 1} · {g.title}
                  </span>
                  {goalStatusPill(g.status)}
                </div>
                {g.criterion && (
                  <p className="text-xs text-ink-faint mt-1">준거: {g.criterion}</p>
                )}
                {g.status === "ACTIVE" && (
                  <form
                    action={setGoalStatus.bind(null, g.id, patient.id, "MET")}
                    className="mt-2"
                  >
                    <button
                      type="submit"
                      className="text-[11.5px] font-semibold text-good bg-good-soft rounded-md px-2.5 py-1 hover:opacity-80"
                    >
                      준거 도달 처리
                    </button>
                  </form>
                )}
              </div>
            ))}
            <details className="mt-3">
              <summary className="text-xs font-semibold text-accent-deep cursor-pointer">
                + 목표 추가
              </summary>
              <form
                action={addGoal.bind(null, patient.id)}
                className="flex flex-col gap-2 mt-3 text-sm"
              >
                <select
                  name="kind"
                  className="border border-line rounded-lg px-2 py-2 bg-white w-fit"
                  defaultValue="SHORT"
                >
                  <option value="LONG">장기목표</option>
                  <option value="SHORT">단기목표</option>
                </select>
                <input
                  name="title"
                  required
                  placeholder="목표 내용 *"
                  className="border border-line rounded-lg px-3 py-2"
                />
                <input
                  name="criterion"
                  placeholder="준거 (예: 3회기 연속 80% 정반응)"
                  className="border border-line rounded-lg px-3 py-2"
                />
                <button
                  type="submit"
                  className="bg-accent text-white rounded-lg py-2 font-semibold w-fit px-4"
                >
                  추가
                </button>
              </form>
            </details>
          </Card>

          <Card>
            <Eyebrow>정반응률 추이 — 최근 회기</Eyebrow>
            <AccuracyChart points={chartPoints} />
          </Card>

          {(trendsByKind.size > 0 || obsTrend.length > 0 || fatigueTrend.length > 0 || selfIntelTrend.length > 0 || conditionTrend.length > 0) && (
            <Card>
              <Eyebrow>비진단 음성지표 · 보호자 관찰 추이 (시계열 저장)</Eyebrow>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trendsByKind.has("MPT") && (
                  <TrendChart
                    title="최대연장발성 지속시간"
                    sub="발성 과제 · 단말 산출"
                    unit="초"
                    points={trendsByKind.get("MPT")!.points.slice(-8)}
                  />
                )}
                {trendsByKind.has("DDK") && (
                  <TrendChart
                    title="교대운동 초당 반복수"
                    sub="AMR/SMR 과제 · 단말 산출"
                    unit="회/초"
                    points={trendsByKind.get("DDK")!.points.slice(-8)}
                  />
                )}
                {trendsByKind.has("READ") && (
                  <TrendChart
                    title="읽기 무음구간"
                    sub="읽기·자발화 과제 · 낮을수록 쉼 적음"
                    unit="회"
                    points={trendsByKind.get("READ")!.points.slice(-8)}
                  />
                )}
                {obsTrend.length > 0 && (
                  <TrendChart
                    title="보호자 이해도"
                    sub="보호자 관찰 데이터"
                    unit="/5"
                    points={obsTrend.slice(-8)}
                  />
                )}
                {fatigueTrend.length > 0 && (
                  <TrendChart
                    title="자가평가 피로도"
                    sub="오늘 말하기 피로도"
                    unit="/10"
                    points={fatigueTrend.slice(-8)}
                  />
                )}
                {selfIntelTrend.length > 0 && (
                  <TrendChart
                    title="자가평가 전달감"
                    sub="오늘 말이 잘 나온 정도"
                    unit="/5"
                    points={selfIntelTrend.slice(-8)}
                  />
                )}
                {conditionTrend.length > 0 && (
                  <TrendChart
                    title="자가평가 컨디션"
                    sub="오늘 말하기 컨디션"
                    unit="/5"
                    points={conditionTrend.slice(-8)}
                  />
                )}
              </div>
              <p className="text-[11px] text-ink-faint mt-2.5">
                ※ 비진단 참고지표입니다. 측정 환경에 따라 변동될 수 있으며 해석은 치료사가 합니다.
              </p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <Eyebrow>이번 주 홈프로그램</Eyebrow>
            {!rx || rx.items.length === 0 ? (
              <p className="text-sm text-ink-faint py-2">
                이번 주 처방이 없습니다.{" "}
                <Link
                  href={`/patients/${patient.id}/prescribe`}
                  className="text-accent-deep font-semibold"
                >
                  처방하기 →
                </Link>
              </p>
            ) : (
              rx.items
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2 border-b border-line last:border-0 text-[13px]"
                  >
                    <span className="w-6 shrink-0 font-bold text-ink-faint text-xs">
                      {DAY_LABELS[item.dayOfWeek]}
                    </span>
                    <span className="min-w-0 truncate">{item.activity.title}</span>
                    <span className="ml-auto shrink-0">
                      {item.status === "DONE" ? (
                        <Pill tone="good">완료</Pill>
                      ) : (
                        <Pill tone="grey">대기</Pill>
                      )}
                    </span>
                  </div>
                ))
            )}
            {rx && rx.items.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar
                  value={
                    (rx.items.filter((i) => i.status === "DONE").length /
                      rx.items.length) *
                    100
                  }
                />
                <span className="text-xs font-bold tabular text-accent-deep">
                  {rx.items.filter((i) => i.status === "DONE").length}/
                  {rx.items.length}
                </span>
              </div>
            )}
          </Card>

          <Card>
            <Eyebrow>검사 기록</Eyebrow>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-ink-soft">조음·음운 선별검사</p>
              <Link
                href={`/assessments/new/${patient.id}`}
                className="text-xs font-semibold text-accent-deep"
              >
                + 새 검사 시행
              </Link>
            </div>
            {patient.articulationTests.length === 0 && (
              <p className="text-xs text-ink-faint mb-2">시행 이력이 없습니다.</p>
            )}
            {patient.articulationTests.map((t) => {
              const tr = JSON.parse(t.resultJson);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 py-1.5 border-b border-line last:border-0 text-[13px]"
                >
                  <span className="tabular text-ink-faint text-xs">{fmtDateTime(t.date)}</span>
                  <Pill tone="grey">{t.level === "SENTENCE" ? "문장" : "낱말"}</Pill>
                  <span className="ml-auto flex items-center gap-2">
                    <Pill tone={tr.pcc >= 85 ? "good" : tr.pcc >= 65 ? "warn" : "crit"}>
                      PCC {tr.pcc}%
                    </Pill>
                    <Link
                      href={`/assessments/${t.id}`}
                      className="text-xs font-semibold text-accent-deep"
                    >
                      결과
                    </Link>
                  </span>
                </div>
              );
            })}

            <p className="text-xs font-semibold text-ink-soft mt-4 mb-2">구음장애 선별 배터리</p>
            {patient.dysarthriaTests.length === 0 && (
              <p className="text-xs text-ink-faint mb-2">시행 이력이 없습니다.</p>
            )}
            {patient.dysarthriaTests.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 py-1.5 border-b border-line last:border-0 text-[13px]"
              >
                <span className="tabular text-ink-faint text-xs">{fmtDateTime(t.date)}</span>
                {t.intelligibility && <Pill tone="teal">명료도 {t.intelligibility}/5</Pill>}
                <span className="ml-auto">
                  <Link
                    href={`/assessments/dys/${t.id}`}
                    className="text-xs font-semibold text-accent-deep"
                  >
                    결과
                  </Link>
                </span>
              </div>
            ))}

            <p className="text-xs font-semibold text-ink-soft mt-4 mb-2">
              표준화 검사 점수
            </p>
            {patient.standardScores.length === 0 && (
              <p className="text-xs text-ink-faint mb-2">입력된 점수가 없습니다.</p>
            )}
            {patient.standardScores.map((s) => (
              <div
                key={s.id}
                className="py-1.5 border-b border-line last:border-0 text-[12.5px]"
              >
                <span className="font-semibold">{s.testName}</span>
                <span className="text-ink-faint tabular"> · {fmtDate(s.date)}</span>
                <span className="block text-ink-soft tabular">
                  {[
                    s.rawScore && `원점수 ${s.rawScore}`,
                    s.standardScore && `표준점수 ${s.standardScore}`,
                    s.percentile && `백분위 ${s.percentile}`,
                    s.note,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ))}
            <details className="mt-2">
              <summary className="text-xs font-semibold text-accent-deep cursor-pointer">
                + 표준화 검사 점수 입력
              </summary>
              <form
                action={addStandardScore.bind(null, patient.id)}
                className="flex flex-col gap-2 mt-3 text-sm"
              >
                <select
                  name="testName"
                  required
                  className="border border-line rounded-lg px-2 py-2 bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    검사 선택
                  </option>
                  {STANDARD_TESTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    name="rawScore"
                    placeholder="원점수"
                    className="border border-line rounded-lg px-2.5 py-2 flex-1 min-w-0"
                  />
                  <input
                    name="standardScore"
                    placeholder="표준점수"
                    className="border border-line rounded-lg px-2.5 py-2 flex-1 min-w-0"
                  />
                  <input
                    name="percentile"
                    placeholder="백분위"
                    className="border border-line rounded-lg px-2.5 py-2 flex-1 min-w-0"
                  />
                </div>
                <input
                  name="note"
                  placeholder="비고 (예: 자음정확도 71.4%)"
                  className="border border-line rounded-lg px-2.5 py-2"
                />
                <button
                  type="submit"
                  className="bg-accent text-white rounded-lg py-2 font-semibold w-fit px-4"
                >
                  저장
                </button>
              </form>
            </details>
          </Card>

          <Card>
            <Eyebrow>최근 치료사 검수 결과</Eyebrow>
            {recentReviewed.length === 0 && (
              <p className="text-sm text-ink-faint py-2">최근 치료사 검수 결과가 없습니다.</p>
            )}
            {recentReviewed.map((s) => {
              const meta = parseReviewMeta(s.reviewMetaJson);
              const confirmed = meta?.errorReviews?.filter((e) => e.action === "confirm" || e.action === "modify") ?? [];
              return (
                <div key={s.id} className="py-2.5 border-b border-line last:border-0 text-[13px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{s.item?.activity.title ?? s.targetText ?? "제출 과제"}</span>
                    {s.reviewOpinion && <Pill tone="teal">{s.reviewOpinion}</Pill>}
                    <span className="text-xs text-ink-faint tabular">{fmtDateTime(s.reviewedAt ?? s.createdAt)}</span>
                  </div>
                  {meta?.aiReference?.mismatches && meta.aiReference.mismatches.length > 0 && (
                    <p className="text-xs text-ink-soft mt-1">
                      불일치 후보: {meta.aiReference.mismatches.slice(0, 2).join(" · ")}
                    </p>
                  )}
                  {confirmed.length > 0 && (
                    <p className="text-xs text-accent-deep mt-1">
                      오류 유형 확정 내역: {confirmed.map((e) => `${e.errorType}(${e.action === "modify" ? "수정" : "확정"})`).join(" · ")}
                    </p>
                  )}
                  {meta?.nextTask?.recommended && (
                    <p className="text-xs text-ink-soft mt-1">
                      최근 권장 과제: {meta.nextTask.note ?? "홈프로그램 처방 화면에서 다음 과제 배정"}
                    </p>
                  )}
                  {meta?.therapistMemo && (
                    <p className="text-xs text-ink-faint mt-1">검수 메모: {meta.therapistMemo}</p>
                  )}
                </div>
              );
            })}
          </Card>

          <Card>
            <Eyebrow>세션 기록 (SOAP)</Eyebrow>
            <details className="mb-3" open={recentSessions.length === 0}>
              <summary className="text-xs font-semibold text-accent-deep cursor-pointer">
                + 세션 기록 작성
              </summary>
              <form
                action={addSessionNote.bind(null, patient.id)}
                className="flex flex-col gap-2 mt-3 text-sm"
              >
                <div className="flex gap-2">
                  <input
                    name="accuracy"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="정반응률 %"
                    className="border border-line rounded-lg px-3 py-2 w-32"
                  />
                  <input
                    name="minutes"
                    type="number"
                    defaultValue={30}
                    className="border border-line rounded-lg px-3 py-2 w-24"
                    aria-label="세션 시간(분)"
                  />
                </div>
                <textarea
                  name="soapO"
                  rows={2}
                  placeholder="O — 관찰/측정 (예: /ㅅ/ 어중 20회 중 13회 정반응)"
                  className="border border-line rounded-lg px-3 py-2 resize-y"
                />
                <textarea
                  name="soapP"
                  rows={2}
                  placeholder="P — 계획 (예: 다음 회기 시각 단서 제거)"
                  className="border border-line rounded-lg px-3 py-2 resize-y"
                />
                <button
                  type="submit"
                  className="bg-accent text-white rounded-lg py-2 font-semibold w-fit px-4"
                >
                  저장
                </button>
              </form>
            </details>
            {recentSessions.map((s) => (
              <div key={s.id} className="py-2.5 border-b border-line last:border-0 text-[13px]">
                <p className="font-bold text-xs text-accent-deep tabular">
                  {fmtDateTime(s.date)} · {s.minutes}분
                  {s.accuracy !== null && (
                    <span className="ml-2 text-ink">정반응률 {s.accuracy}%</span>
                  )}
                </p>
                {s.soapO && (
                  <p className="text-ink-soft mt-1">
                    <b className="text-ink">O</b> {s.soapO}
                  </p>
                )}
                {s.soapP && (
                  <p className="text-ink-soft mt-0.5">
                    <b className="text-ink">P</b> {s.soapP}
                  </p>
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
