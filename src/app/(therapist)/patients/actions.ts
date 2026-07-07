"use server";

import { unlink } from "fs/promises";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deletePatient(patientId: string) {
  const subs = await db.submission.findMany({
    where: { patientId, audioPath: { not: null } },
    select: { audioPath: true },
  });
  await db.patient.delete({ where: { id: patientId } });
  // 녹음 파일 정리 (실패해도 무시)
  for (const s of subs) {
    try {
      await unlink(s.audioPath!);
    } catch {}
  }
  revalidatePath("/patients");
  redirect("/patients");
}

export async function createPatient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const diagnosis = String(formData.get("diagnosis") ?? "").trim();
  if (!name || !diagnosis) return;
  const birthYearRaw = String(formData.get("birthYear") ?? "").trim();
  const patient = await db.patient.create({
    data: {
      name,
      diagnosis,
      birthYear: birthYearRaw ? Number(birthYearRaw) : null,
      gender: String(formData.get("gender") ?? "") || null,
      memo: String(formData.get("memo") ?? "") || null,
    },
  });
  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

export async function addGoal(patientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const count = await db.goal.count({ where: { patientId } });
  await db.goal.create({
    data: {
      patientId,
      kind: String(formData.get("kind") ?? "SHORT"),
      title,
      criterion: String(formData.get("criterion") ?? "") || null,
      order: count,
    },
  });
  revalidatePath(`/patients/${patientId}`);
}

export async function setGoalStatus(goalId: string, patientId: string, status: string) {
  await db.goal.update({ where: { id: goalId }, data: { status } });
  revalidatePath(`/patients/${patientId}`);
}

export async function addSessionNote(patientId: string, formData: FormData) {
  const accuracyRaw = String(formData.get("accuracy") ?? "").trim();
  await db.sessionNote.create({
    data: {
      patientId,
      accuracy: accuracyRaw ? Math.max(0, Math.min(100, Number(accuracyRaw))) : null,
      minutes: Number(formData.get("minutes") ?? 30),
      soapO: String(formData.get("soapO") ?? "") || null,
      soapP: String(formData.get("soapP") ?? "") || null,
    },
  });
  revalidatePath(`/patients/${patientId}`);
}
