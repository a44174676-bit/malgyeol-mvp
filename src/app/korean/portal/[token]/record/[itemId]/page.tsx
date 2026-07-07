import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { KOREAN_NOTICE, KOREAN_SERVICE_LINE } from "@/lib/korean-copy";
import { KoreanRecorder } from "./KoreanRecorder";

export const dynamic = "force-dynamic";

export default async function KoreanRecordPage({
  params,
}: {
  params: Promise<{ token: string; itemId: string }>;
}) {
  const { token, itemId } = await params;
  const item = await db.prescriptionItem.findUnique({
    where: { id: itemId },
    include: { activity: true, prescription: { include: { patient: true } } },
  });
  if (
    !item ||
    item.activity.serviceLine !== KOREAN_SERVICE_LINE ||
    item.prescription.patient.serviceLine !== KOREAN_SERVICE_LINE ||
    item.prescription.patient.portalToken !== token
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ground p-4 sm:p-7">
      <div className="max-w-2xl mx-auto">
        <Link href={`/korean/portal/${token}`} className="text-sm font-semibold text-accent-deep">
          오늘의 과제로 돌아가기
        </Link>
        <div className="mt-4">
          <KoreanRecorder
            token={token}
            itemId={item.id}
            targetText={item.activity.targetText ?? item.activity.title}
            focus={item.activity.level}
          />
        </div>
        <p className="text-[11px] text-ink-faint leading-relaxed mt-5">{KOREAN_NOTICE}</p>
      </div>
    </main>
  );
}
