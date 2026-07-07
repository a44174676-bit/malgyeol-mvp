import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDateTime, age } from "@/lib/dates";
import { metricRows, DISCLAIMER } from "@/lib/metrics";
import { parseBatteryResults, batteryKeyIndicators, DYSARTHRIA_BATTERY } from "@/lib/battery";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { rateBattery } from "./actions";

export const dynamic = "force-dynamic";

export default async function BatteryResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await db.dysarthriaTest.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!test) notFound();

  const results = parseBatteryResults(test.resultsJson);
  const keys = batteryKeyIndicators(results);

  // 직전 배터리 (동일 환자) — 반복 시행 추이
  const prev = await db.dysarthriaTest.findFirst({
    where: { patientId: test.patientId, date: { lt: test.date } },
    orderBy: { date: "desc" },
  });
  const prevKeys = prev ? batteryKeyIndicators(parseBatteryResults(prev.resultsJson)) : null;

  const delta = (cur: number | null, before: number | null | undefined, unit: string) => {
    if (cur === null || before === null || before === undefined) return null;
    const d = Math.round((cur - before) * 10) / 10;
    return `${d >= 0 ? "+" : ""}${d}${unit}`;
  };

  const indicators = [
    { label: "최대연장발성", value: keys.mptSec, unit: "초", prev: prevKeys?.mptSec },
    { label: 'AMR "파" 초당 반복', value: keys.paRate, unit: "회/초", prev: prevKeys?.paRate },
    { label: "SMR 초당 반복", value: keys.smrRate, unit: "회/초", prev: prevKeys?.smrRate },
    { label: "문단 무음구간", value: keys.paraPauses, unit: "회", prev: prevKeys?.paraPauses },
    { label: "문단 말끝 강도 변화", value: keys.paraEndDelta, unit: "dB", prev: prevKeys?.paraEndDelta },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">
          구음장애 선별 배터리 결과{" "}
          <span className="text-sm font-medium text-ink-soft">
            — {test.patient.name} · {age(test.patient.birthYear)} · {fmtDateTime(test.date)}
          </span>
        </h1>
        <span className="flex gap-3">
          <Link href={`/patients/${test.patientId}`} className="text-[13px] font-semibold text-accent-deep">
            환자 상세 →
          </Link>
          <Link href="/assessments" className="text-[13px] font-semibold text-ink-faint">
            검사 목록
          </Link>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {indicators.map((ind) => (
          <Card key={ind.label} className="text-center">
            <p className="text-[11.5px] text-ink-soft mb-1">{ind.label}</p>
            <p className="text-[22px] font-extrabold tabular leading-tight">
              {ind.value !== null ? ind.value : "—"}
              <span className="text-[11px] font-semibold text-ink-faint ml-0.5">{ind.unit}</span>
            </p>
            {delta(ind.value, ind.prev, ind.unit) && (
              <p className="text-[11px] font-bold text-accent-deep tabular mt-0.5">
                직전 대비 {delta(ind.value, ind.prev, ind.unit)}
              </p>
            )}
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-ink-faint mb-4">
        <Pill tone="grey">비진단 참고지표</Pill> 상대값 기반 측정으로 환경에 따라 변동될 수
        있으며, 증감만으로 호전/악화를 결정하지 않습니다.
        {prev && ` 직전 시행: ${fmtDateTime(prev.date)}.`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 items-start">
        <Card>
          <Eyebrow>하위 과제별 상세</Eyebrow>
          {results.map((r, i) => (
            <div key={r.key} className="py-3 border-b border-line last:border-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <b className="text-[13.5px]">{r.title}</b>
                <Pill tone="grey">{DYSARTHRIA_BATTERY.find((s) => s.key === r.key)?.kind ?? r.kind}</Pill>
                {!r.metrics && <Pill tone="warn">건너뜀 / 미시행</Pill>}
                {r.audioPath && (
                  <audio controls preload="none" src={`/api/dysarthria-audio/${test.id}/${i}`}
                    className="h-8 ml-auto max-w-52" />
                )}
              </div>
              {r.metrics && (
                <div className="grid grid-cols-2 gap-x-5">
                  {metricRows(r.metrics).map(([k, v]) => (
                    <p key={k} className="flex justify-between text-[12.5px] py-0.5 border-b border-line last:border-0">
                      <span className="text-ink-soft">{k}</span>
                      <b className="tabular">{v}</b>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>

        <Card>
          <Eyebrow>치료사 평정 · 메모</Eyebrow>
          <form action={rateBattery.bind(null, test.id)} className="flex flex-col gap-3">
            <div>
              <p className="text-[13px] font-semibold mb-1.5">
                말명료도 평정 (1–5) — 문단 읽기 기준
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex-1">
                    <input
                      type="radio"
                      name="intelligibility"
                      value={n}
                      defaultChecked={test.intelligibility === n}
                      className="peer sr-only"
                    />
                    <span className="block text-center border-2 border-line rounded-lg py-2.5 text-sm font-bold text-ink-soft cursor-pointer peer-checked:bg-accent peer-checked:border-accent peer-checked:text-white">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-ink-faint mt-1">
                1 대부분 이해 불가 · 3 절반 정도 이해 · 5 거의 모두 이해
              </p>
            </div>
            <textarea
              name="note"
              rows={4}
              defaultValue={test.note ?? ""}
              placeholder="검사 중 관찰 메모 (예: SMR을 '퍼터커'로 대체 시행, 후반부 피로 관찰)"
              className="border border-line rounded-lg px-3 py-2 text-sm resize-y"
            />
            <button type="submit"
              className="bg-accent text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-accent-deep">
              평정 저장
            </button>
          </form>
          {test.intelligibility && (
            <p className="text-[12.5px] text-good font-semibold mt-3">
              ✓ 저장됨 — 말명료도 {test.intelligibility}/5
            </p>
          )}
        </Card>
      </div>

      <p className="text-[11px] text-ink-faint leading-relaxed mt-6 border-t border-line pt-3">
        {DISCLAIMER}
      </p>
    </div>
  );
}
