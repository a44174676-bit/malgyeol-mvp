import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { age } from "@/lib/dates";
import { DISCLAIMER } from "@/lib/metrics";
import { BatteryRunner } from "./BatteryRunner";

export const dynamic = "force-dynamic";

export default async function BatteryPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) notFound();

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">
          구음장애 선별 배터리{" "}
          <span className="text-sm font-medium text-ink-soft">
            — {patient.name} · {age(patient.birthYear)} · {patient.diagnosis}
          </span>
        </h1>
        <Link href="/assessments" className="text-[13px] font-semibold text-accent-deep">
          ← 검사 목록으로
        </Link>
      </div>
      <BatteryRunner patientId={patient.id} patientName={patient.name} />
      <p className="text-[11px] text-ink-faint leading-relaxed mt-5 max-w-2xl">
        MPT → AMR(파·타·카) → SMR → 문장 → 문단 순서로 시행합니다. 발성·조음·호흡·명료도 축을
        한 세션에서 표집해 단일 과제 검사의 신뢰도 한계를 보완합니다. {DISCLAIMER}
      </p>
    </div>
  );
}
