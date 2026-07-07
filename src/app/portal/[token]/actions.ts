"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** 보호자 관찰 데이터 제출 (특허 단계 ②) */
export async function submitObservation(token: string, formData: FormData) {
  const patient = await db.patient.findUnique({ where: { portalToken: token } });
  if (!patient) return;
  const num = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : Math.max(0, Math.min(10, Number(v)));
  };
  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;
  await db.observationEntry.create({
    data: {
      patientId: patient.id,
      fatigue: num("fatigue"),
      selfIntel: num("selfIntel"),
      famIntel: num("famIntel"),
      repeatQ: str("repeatQ"),
      phoneCall: str("phoneCall"),
      cough: str("cough"),
      memo: str("memo"),
    },
  });
  revalidatePath(`/portal/${token}`);
}

/** 체크형/놀이형 과제 완료 토글 (보호자 포털) */
export async function toggleItemDone(token: string, itemId: string) {
  const item = await db.prescriptionItem.findUnique({
    where: { id: itemId },
    include: { prescription: { include: { patient: true } }, activity: true },
  });
  if (!item || item.prescription.patient.portalToken !== token) return;
  if (item.activity.format === "RECORD") return; // 녹음형은 녹음 제출로만 완료
  await db.prescriptionItem.update({
    where: { id: itemId },
    data: { status: item.status === "DONE" ? "PENDING" : "DONE" },
  });
  revalidatePath(`/portal/${token}`);
}
