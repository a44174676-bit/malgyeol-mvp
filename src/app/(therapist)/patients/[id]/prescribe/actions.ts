"use server";

import { db } from "@/lib/db";
import { weekStart } from "@/lib/dates";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function savePrescription(
  patientId: string,
  items: { activityId: string; dayOfWeek: number }[],
  obsKeys: string[] = []
) {
  const ws = weekStart();
  // 이번 주 기존 처방은 교체하되, 동일 활동·요일의 완료 상태는 보존
  const existing = await db.prescription.findFirst({
    where: { patientId, weekStart: ws },
    include: { items: true },
  });
  const doneKeys = new Set(
    (existing?.items ?? [])
      .filter((i) => i.status === "DONE")
      .map((i) => `${i.activityId}:${i.dayOfWeek}`)
  );
  if (existing) {
    await db.prescription.delete({ where: { id: existing.id } });
  }
  if (items.length > 0) {
    await db.prescription.create({
      data: {
        patientId,
        weekStart: ws,
        obsItemsJson: obsKeys.length > 0 ? JSON.stringify(obsKeys) : null,
        items: {
          create: items.map((i) => ({
            activityId: i.activityId,
            dayOfWeek: i.dayOfWeek,
            status: doneKeys.has(`${i.activityId}:${i.dayOfWeek}`) ? "DONE" : "PENDING",
          })),
        },
      },
    });
  }
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}`);
}
