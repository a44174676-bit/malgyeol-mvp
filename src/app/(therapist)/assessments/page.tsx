import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/dates";
import { parseBatteryResults, batteryKeyIndicators } from "@/lib/battery";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { startAssessment } from "./actions";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const [patients, artTests, dysTests] = await Promise.all([
    db.patient.findMany({ orderBy: { name: "asc" } }),
    db.articulationTest.findMany({
      include: { patient: true },
      orderBy: { date: "desc" },
      take: 15,
    }),
    db.dysarthriaTest.findMany({
      include: { patient: true },
      orderBy: { date: "desc" },
      take: 15,
    }),
  ]);

  const rows = [
    ...artTests.map((t) => ({
      id: t.id,
      href: `/assessments/${t.id}`,
      patient: t.patient.name,
      date: t.date,
      type: t.level === "SENTENCE" ? "조음 선별 · 문장" : "조음 선별 · 낱말",
      badge: (() => {
        const r = JSON.parse(t.resultJson);
        return { text: `PCC ${r.pcc}%`, tone: r.pcc >= 85 ? "good" : r.pcc >= 65 ? "warn" : "crit" } as const;
      })(),
      ai: Boolean(t.aiSummary),
    })),
    ...dysTests.map((t) => ({
      id: t.id,
      href: `/assessments/dys/${t.id}`,
      patient: t.patient.name,
      date: t.date,
      type: "구음장애 배터리",
      badge: (() => {
        const k = batteryKeyIndicators(parseBatteryResults(t.resultsJson));
        return {
          text: k.mptSec !== null ? `MPT ${k.mptSec}초` : "지표 보기",
          tone: "teal",
        } as const;
      })(),
      ai: Boolean(t.aiSummary),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const TESTS = [
    {
      level: "WORD",
      title: "조음·음운 선별 — 낱말 (27문항)",
      desc: "그림 자극 낱말 이름대기 · 19개 초성 전체 커버 · PCC·음운변동 자동 분석 · 주 대상: 아동",
    },
    {
      level: "SENTENCE",
      title: "조음·음운 선별 — 문장 (10문항)",
      desc: "음소 부하 문장 읽기/따라말하기 · 연결발화 일반화 확인 · 낱말 결과와 교차 비교 · 주 대상: 아동",
    },
    {
      level: "BATTERY",
      title: "구음장애 선별 배터리 (7과제)",
      desc: "MPT → AMR 파·타·카 → SMR → 문장 → 문단 연속 시행 · 발성·조음·호흡·명료도 종합 · 주 대상: 성인 운동구어장애",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">검사</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <Card>
          <Eyebrow>검사 시행 기록</Eyebrow>
          {rows.length === 0 && (
            <p className="text-sm text-ink-faint py-4">
              아직 시행한 검사가 없습니다. 오른쪽에서 환자와 검사를 선택해 시작하세요.
            </p>
          )}
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 flex-wrap">
              <div className="min-w-0">
                <Link href={r.href} className="font-semibold text-[13.5px] hover:text-accent-deep">
                  {r.patient}
                </Link>
                <p className="text-xs text-ink-faint">
                  {r.type} · {fmtDateTime(r.date)}
                </p>
              </div>
              <span className="ml-auto flex items-center gap-2">
                <Pill tone={r.badge.tone}>{r.badge.text}</Pill>
                {r.ai && <Pill tone="teal">AI 해석</Pill>}
                <Link href={r.href} className="text-xs font-semibold text-accent-deep">
                  결과 →
                </Link>
              </span>
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <Eyebrow>새 검사 시행</Eyebrow>
            <form action={startAssessment} className="flex flex-col gap-3 text-sm">
              <select
                name="patientId"
                required
                className="border border-line rounded-lg px-2 py-2.5 bg-white"
                defaultValue=""
              >
                <option value="" disabled>환자 선택</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.diagnosis}
                  </option>
                ))}
              </select>
              <div className="flex flex-col gap-2">
                {TESTS.map((t) => (
                  <label
                    key={t.level}
                    className="border border-line rounded-xl p-3 flex gap-2.5 items-start cursor-pointer has-checked:border-accent has-checked:bg-accent-soft"
                  >
                    <input
                      type="radio"
                      name="testType"
                      value={t.level}
                      defaultChecked={t.level === "WORD"}
                      className="mt-1 accent-[#0e6f66]"
                    />
                    <span>
                      <span className="block font-semibold text-[13px]">{t.title}</span>
                      <span className="block text-[11.5px] text-ink-soft mt-0.5">{t.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="bg-accent text-white rounded-lg py-2.5 font-semibold hover:bg-accent-deep"
              >
                검사 시작
              </button>
            </form>
            <p className="text-[11.5px] text-ink-faint mt-3 leading-relaxed">
              말결 자체 선별 프로토콜입니다. 한 축의 검사만으로 판단하지 않도록 낱말·문장·배터리를
              교차 시행하는 것을 권장합니다. 결과는 비진단 참고 정보입니다.
            </p>
          </Card>

          <Card>
            <Eyebrow>표준화 검사 점수 관리</Eyebrow>
            <p className="text-[12.5px] text-ink-soft leading-relaxed">
              U-TAP2 · PRES · REVT · SMST 등 표준화 검사는 각 환자 상세 화면의{" "}
              <b>표준화 검사 기록</b>에서 회차별 점수를 입력하면 추이가 관리됩니다. 자체 선별검사는
              표준화 검사의 대체가 아닌 보완입니다.
            </p>
            <p className="text-[11.5px] text-ink-faint mt-2 leading-relaxed">
              ※ 출판 검사도구의 문항·규준표는 저작권 보호 대상이라 플랫폼에 내장하지 않습니다.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
