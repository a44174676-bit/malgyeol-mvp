import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DISCLAIMER } from "@/lib/metrics";
import { Recorder } from "./Recorder";

export const dynamic = "force-dynamic";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ token: string; itemId: string }>;
}) {
  const { token, itemId } = await params;
  const item = await db.prescriptionItem.findUnique({
    where: { id: itemId },
    include: {
      activity: true,
      prescription: { include: { patient: true } },
    },
  });
  if (!item || item.prescription.patient.portalToken !== token) notFound();

  return (
    <main className="flex-1 max-w-md w-full mx-auto p-5">
      <Link
        href={`/portal/${token}`}
        className="inline-block text-sm font-semibold text-accent-deep mb-4 pt-2"
      >
        ← 오늘의 과제로
      </Link>
      <h1 className="text-[17px] font-extrabold mb-1">{item.activity.title}</h1>
      <p className="text-xs text-ink-soft mb-5">{item.activity.description}</p>
      <Recorder
        token={token}
        itemId={item.id}
        targetText={item.activity.targetText}
        metricKind={item.activity.metricKind}
        goalCondition={item.activity.goalCondition}
      />
      <p className="text-[11px] text-ink-faint leading-relaxed mt-6 border-t border-line pt-3">
        {DISCLAIMER}
      </p>
    </main>
  );
}
