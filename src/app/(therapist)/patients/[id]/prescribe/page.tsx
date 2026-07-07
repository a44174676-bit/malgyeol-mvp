import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { weekStart, fmtDate } from "@/lib/dates";
import { PrescribeClient } from "./PrescribeClient";

export const dynamic = "force-dynamic";

export default async function PrescribePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fromSubmission?: string; activity?: string }>;
}) {
  const { id } = await params;
  const { fromSubmission, activity } = await searchParams;
  const [patient, activities] = await Promise.all([
    db.patient.findUnique({
      where: { id, serviceLine: "CARE" },
      include: {
        prescriptions: {
          where: { weekStart: weekStart() },
          include: { items: true },
        },
      },
    }),
    db.activity.findMany({ where: { serviceLine: "CARE" }, orderBy: { area: "asc" } }),
  ]);
  if (!patient) notFound();

  const ws = weekStart();
  const weekEnd = new Date(ws);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const initialItems = (patient.prescriptions[0]?.items ?? []).map((i) => ({
    activityId: i.activityId,
    dayOfWeek: i.dayOfWeek,
  }));
  const initialObsKeys: string[] = (() => {
    try {
      return JSON.parse(patient.prescriptions[0]?.obsItemsJson ?? "null") ?? [];
    } catch { return []; }
  })();

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
        <h1 className="text-xl font-bold">
          홈프로그램 처방{" "}
          <span className="text-sm font-medium text-ink-soft">
            — {patient.name} · {fmtDate(ws)} ~ {fmtDate(weekEnd)}
          </span>
        </h1>
        <Link
          href={`/patients/${patient.id}`}
          className="text-[13px] font-semibold text-accent-deep"
        >
          ← 환자 상세로
        </Link>
      </div>
      {fromSubmission && (
        <div className="bg-accent-soft border border-accent-soft text-accent-deep rounded-xl px-4 py-3 mb-4 text-[13px]">
          <b className="block mb-0.5">치료사 검수 결과에서 이어진 다음 과제 배정</b>
          <span>
            최근 검수 과제: {activity ?? "제출 과제"} · 필요한 경우 난이도와 수행 빈도를 조정해 저장하세요.
          </span>
        </div>
      )}
      <PrescribeClient
        patientId={patient.id}
        activities={activities}
        initialItems={initialItems}
        initialObsKeys={initialObsKeys}
      />
    </div>
  );
}
