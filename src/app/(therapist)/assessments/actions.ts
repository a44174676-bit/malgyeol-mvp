"use server";

import { db } from "@/lib/db";
import { decompose, type TestItem } from "@/lib/phonology";
import { aiComplete } from "@/lib/ai";
import { age } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function startAssessment(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) return;
  const testType = String(formData.get("testType") ?? "WORD");
  if (testType === "BATTERY") redirect(`/assessments/battery/${patientId}`);
  if (testType === "SENTENCE") redirect(`/assessments/new/${patientId}?level=SENTENCE`);
  redirect(`/assessments/new/${patientId}`);
}

export async function addStandardScore(patientId: string, formData: FormData) {
  const testName = String(formData.get("testName") ?? "").trim();
  if (!testName) return;
  await db.standardScore.create({
    data: {
      patientId,
      testName,
      rawScore: String(formData.get("rawScore") ?? "") || null,
      standardScore: String(formData.get("standardScore") ?? "") || null,
      percentile: String(formData.get("percentile") ?? "") || null,
      note: String(formData.get("note") ?? "") || null,
    },
  });
  revalidatePath(`/patients/${patientId}`);
}

export async function generateAiSummary(testId: string) {
  const test = await db.articulationTest.findUnique({
    where: { id: testId },
    include: { patient: true },
  });
  if (!test) return;

  const result = JSON.parse(test.resultJson);
  const items = JSON.parse(test.itemsJson) as TestItem[];
  const errorItems = items.filter(
    (i) => i.word !== i.response || (i.distorted?.length ?? 0) > 0
  );
  const describeItem = (i: TestItem) => {
    const dist = (i.distorted ?? [])
      .map((d) => {
        const syl = decompose(i.word)[d.syl];
        return syl ? `${d.part === "cho" ? syl.cho : syl.jong} 왜곡` : "";
      })
      .filter(Boolean)
      .join(", ");
    const base = `${i.word} → ${i.response || "(무반응)"}`;
    return dist ? `${base} [${dist}]` : base;
  };

  const prompt = `당신은 20년 경력의 언어치료(언어재활) 슈퍼바이저입니다. 아래 아동의 조음·음운 선별검사 결과를 임상적으로 해석해 주세요.

환자: ${test.patient.name}, ${age(test.patient.birthYear)}, 진단: ${test.patient.diagnosis}

[자동 분석 결과]
- 자음정확도(PCC): ${result.pcc}%
- 모음정확도: ${result.pvc}%
- 위치별 정확도: ${JSON.stringify(result.positionStats)}
- 음운변동 빈도: ${JSON.stringify(result.patternCounts)}

[오조음 낱말 (목표 → 아동 발화, 왜곡은 치료사 직접 판정)]
${errorItems.map(describeItem).join("\n") || "없음"}

다음 형식으로 한국어로 작성하세요 (전체 400자 이내, 존댓말):
1. 종합 소견 (연령 대비 해석 포함, 단정 대신 "시사됨/검토 필요" 수준의 표현)
2. 우선 치료 목표 제안 2가지 (음소·위치·수준 명시)
3. 추가 확인이 필요한 사항 1가지
마지막에 "※ AI 보조 해석이며 최종 판단은 치료사의 몫입니다."를 붙이세요.`;

  const summary = await aiComplete(prompt);
  if (summary) {
    await db.articulationTest.update({
      where: { id: testId },
      data: { aiSummary: summary },
    });
  }
  revalidatePath(`/assessments/${testId}`);
}
