import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { age } from "@/lib/dates";
import { WORD_ITEMS, SENTENCE_ITEMS } from "@/lib/words";
import { TestRunner } from "./TestRunner";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { patientId } = await params;
  const { level: levelRaw } = await searchParams;
  const level = levelRaw === "SENTENCE" ? "SENTENCE" : "WORD";
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) notFound();

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">
          조음·음운 선별검사 ({level === "SENTENCE" ? "문장 수준" : "낱말 수준"}){" "}
          <span className="text-sm font-medium text-ink-soft">
            — {patient.name} · {age(patient.birthYear)}
          </span>
        </h1>
        <Link href="/assessments" className="text-[13px] font-semibold text-accent-deep">
          ← 검사 목록으로
        </Link>
      </div>
      <TestRunner
        patientId={patient.id}
        patientName={patient.name}
        stimuli={level === "SENTENCE" ? SENTENCE_ITEMS : WORD_ITEMS}
        level={level}
      />
    </div>
  );
}
