"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function rateBattery(testId: string, formData: FormData) {
  const raw = String(formData.get("intelligibility") ?? "");
  const intelligibility = raw ? Math.max(1, Math.min(5, Number(raw))) : null;
  const note = String(formData.get("note") ?? "") || null;
  await db.dysarthriaTest.update({
    where: { id: testId },
    data: { intelligibility, note },
  });
  revalidatePath(`/assessments/dys/${testId}`);
}
