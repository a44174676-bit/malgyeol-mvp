import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDateTime, age } from "@/lib/dates";
import { aiAvailable } from "@/lib/ai";
import { decompose, type ArtResult, type TestItem } from "@/lib/phonology";
import { Card, Eyebrow, Pill, ProgressBar } from "@/components/ui";
import { generateAiSummary } from "../actions";

export const dynamic = "force-dynamic";

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await db.articulationTest.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!test) notFound();

  // 교차 비교: 같은 환자의 최근 반대 수준 검사 (낱말 ↔ 문장)
  const otherLevel = test.level === "SENTENCE" ? "WORD" : "SENTENCE";
  const crossTest = await db.articulationTest.findFirst({
    where: { patientId: test.patientId, level: otherLevel },
    orderBy: { date: "desc" },
  });
  const crossPcc: number | null = crossTest
    ? (JSON.parse(crossTest.resultJson).pcc ?? null)
    : null;

  const r: ArtResult = JSON.parse(test.resultJson);
  const items: TestItem[] = JSON.parse(test.itemsJson);
  const errorItems = items
    .map((item, index) => ({ ...item, index }))
    .filter((i) => i.word !== i.response || (i.distorted?.length ?? 0) > 0);
  const recorded = items
    .map((item, index) => ({ ...item, index }))
    .filter((i) => i.audioPath);
  const hasKey = aiAvailable();

  const pccTone = r.pcc >= 85 ? "good" : r.pcc >= 65 ? "warn" : "crit";

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">
          검사 결과 <Pill tone="teal">{test.level === "SENTENCE" ? "문장 수준" : "낱말 수준"}</Pill>{" "}
          <span className="text-sm font-medium text-ink-soft">
            — {test.patient.name} · {age(test.patient.birthYear)} ·{" "}
            {fmtDateTime(test.date)}
          </span>
        </h1>
        <span className="flex gap-3">
          <Link
            href={`/patients/${test.patientId}`}
            className="text-[13px] font-semibold text-accent-deep"
          >
            환자 상세 →
          </Link>
          <Link href="/assessments" className="text-[13px] font-semibold text-ink-faint">
            검사 목록
          </Link>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">자음정확도 (PCC)</p>
          <p className="text-[30px] font-extrabold tabular leading-tight">
            {r.pcc}
            <span className="text-sm font-semibold text-ink-faint ml-1">%</span>
          </p>
          <p className="text-xs text-ink-faint mt-1.5 tabular">
            {r.correctConsonants}/{r.totalConsonants} 자음 ·{" "}
            <Pill tone={pccTone}>
              {r.pcc >= 85 ? "경도 이내" : r.pcc >= 65 ? "경도-중등도" : "중등도 이상"}
            </Pill>
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">모음정확도</p>
          <p className="text-[30px] font-extrabold tabular leading-tight">
            {r.pvc}
            <span className="text-sm font-semibold text-ink-faint ml-1">%</span>
          </p>
          <p className="text-xs text-ink-faint mt-1.5 tabular">
            {r.correctVowels}/{r.totalVowels} 모음
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-ink-soft mb-1.5">오류 / 무반응</p>
          <p className="text-[30px] font-extrabold tabular leading-tight">
            {r.errors.length}
            <span className="text-sm font-semibold text-ink-faint ml-1">건</span>
          </p>
          <p className="text-xs text-ink-faint mt-1.5">
            무반응 낱말 {r.noResponseWords.length}개
          </p>
        </Card>
      </div>

      {crossPcc !== null && (
        <Card className="mb-4">
          <p className="text-[13px]">
            <b>낱말 ↔ 문장 교차 비교:</b>{" "}
            {test.level === "SENTENCE" ? "최근 낱말 검사" : "최근 문장 검사"} PCC{" "}
            <b className="tabular">{crossPcc}%</b> ↔ 이번 {test.level === "SENTENCE" ? "문장" : "낱말"} 검사 PCC{" "}
            <b className="tabular">{r.pcc}%</b>
            <span className="text-ink-soft">
              {" "}(차이 {Math.round(Math.abs(r.pcc - crossPcc) * 10) / 10}%p
              {Math.abs(r.pcc - crossPcc) >= 10 &&
                " — 수준 간 차이가 큽니다. 연결발화 일반화 여부를 검토하세요"}
              )
            </span>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <Card>
            <Eyebrow>위치별 정확도</Eyebrow>
            {Object.entries(r.positionStats)
              .filter(([, s]) => s.total > 0)
              .map(([name, s]) => {
                const pct = Math.round((s.correct / s.total) * 100);
                return (
                  <div key={name} className="flex items-center gap-3 py-2">
                    <span className="w-16 text-[13px] font-semibold shrink-0">{name}</span>
                    <ProgressBar
                      value={pct}
                      tone={pct >= 80 ? "bg-accent" : pct >= 50 ? "bg-warn" : "bg-crit"}
                    />
                    <span className="w-20 text-right text-xs font-bold tabular">
                      {pct}% ({s.correct}/{s.total})
                    </span>
                  </div>
                );
              })}
          </Card>

          <Card>
            <Eyebrow>음운변동 패턴 (자동 분류)</Eyebrow>
            {r.patternCounts.length === 0 && (
              <p className="text-sm text-ink-faint py-2">관찰된 오류 패턴이 없습니다.</p>
            )}
            {r.patternCounts.map((p) => (
              <div key={p.pattern} className="flex items-center gap-3 py-1.5">
                <span className="text-[13px] font-semibold w-44 shrink-0">{p.pattern}</span>
                <ProgressBar
                  value={(p.count / Math.max(1, r.errors.length)) * 100}
                  tone="bg-warn"
                />
                <span className="w-14 text-right text-xs font-bold tabular">{p.count}회</span>
              </div>
            ))}
            <p className="text-[11px] text-ink-faint mt-3">
              ※ 표기 전사 기반 자동 분류(근사치)입니다. 최종 판단은 치료사가 합니다.
            </p>
          </Card>

          <Card>
            <Eyebrow>오조음 상세</Eyebrow>
            {errorItems.length === 0 && (
              <p className="text-sm text-ink-faint py-2">모든 낱말 정조음.</p>
            )}
            {errorItems.map((i) => (
              <div
                key={i.index}
                className="flex items-center gap-2 flex-wrap py-1.5 border-b border-line last:border-0 text-[13.5px]"
              >
                <b>{i.word}</b>
                <span className="text-ink-faint">→</span>
                <span className="text-crit font-semibold">
                  {i.response || "(무반응)"}
                </span>
                {(i.distorted ?? []).map((d, k) => {
                  const syl = decompose(i.word)[d.syl];
                  return (
                    <Pill key={k} tone="warn">
                      왜곡: {d.part === "cho" ? syl?.cho : syl?.jong}
                    </Pill>
                  );
                })}
                {i.audioPath && (
                  <audio
                    controls
                    preload="none"
                    src={`/api/assessment-audio/${test.id}/${i.index}`}
                    className="h-8 ml-auto max-w-44"
                  />
                )}
              </div>
            ))}
          </Card>

          {recorded.length > 0 && (
            <Card>
              <Eyebrow>녹음된 문항 · {recorded.length}개</Eyebrow>
              {recorded.map((i) => (
                <div
                  key={i.index}
                  className="flex items-center gap-3 py-1.5 border-b border-line last:border-0 text-[13.5px]"
                >
                  <b className="w-20 shrink-0">{i.word}</b>
                  <audio
                    controls
                    preload="none"
                    src={`/api/assessment-audio/${test.id}/${i.index}`}
                    className="h-8 flex-1"
                  />
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <Eyebrow>자동 분석 소견</Eyebrow>
            <p className="text-[13.5px] leading-relaxed whitespace-pre-line">{r.summary}</p>
          </Card>

          <Card className="border-accent">
            <Eyebrow>AI 종합 해석 (Claude)</Eyebrow>
            {test.aiSummary ? (
              <p className="text-[13.5px] leading-relaxed whitespace-pre-line">
                {test.aiSummary}
              </p>
            ) : hasKey ? (
              <form action={generateAiSummary.bind(null, test.id)}>
                <p className="text-[13px] text-ink-soft mb-3">
                  자동 분석 결과와 오조음 목록을 바탕으로 AI가 종합 소견, 우선 치료
                  목표, 추가 확인 사항을 제안합니다.
                </p>
                <button
                  type="submit"
                  className="bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-accent-deep"
                >
                  AI 해석 생성
                </button>
              </form>
            ) : (
              <p className="text-[13px] text-ink-soft leading-relaxed">
                AI 해석을 사용하려면{" "}
                <code className="bg-ground px-1.5 py-0.5 rounded text-xs">
                  C:\projects\malgyeol\.env
                </code>{" "}
                파일에{" "}
                <code className="bg-ground px-1.5 py-0.5 rounded text-xs">
                  ANTHROPIC_API_KEY=&quot;발급받은 키&quot;
                </code>{" "}
                를 추가하고 서버를 재시작하세요. 키는 console.anthropic.com에서
                발급받습니다. (키가 없어도 왼쪽의 자동 분석은 모두 작동합니다)
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
