"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { weekStart } from "@/lib/dates";
import { KOREAN_SERVICE_LINE, type KoreanReviewMeta } from "@/lib/korean-copy";

export async function assignKoreanTasks(learnerId: string, formData: FormData) {
  const activityIds = formData.getAll("activityId").map(String).filter(Boolean);
  const learner = await db.patient.findUnique({
    where: { id: learnerId, serviceLine: KOREAN_SERVICE_LINE },
  });
  if (!learner) return;

  const activities = await db.activity.findMany({
    where: { id: { in: activityIds }, serviceLine: KOREAN_SERVICE_LINE },
    select: { id: true },
  });
  const ws = weekStart();
  const existing = await db.prescription.findFirst({
    where: { patientId: learnerId, weekStart: ws },
  });
  if (existing) await db.prescription.delete({ where: { id: existing.id } });
  if (activities.length > 0) {
    await db.prescription.create({
      data: {
        patientId: learnerId,
        weekStart: ws,
        obsItemsJson: JSON.stringify(["confidence", "difficulty", "memo"]),
        items: {
          create: activities.map((activity, index) => ({
            activityId: activity.id,
            dayOfWeek: index % 7,
          })),
        },
      },
    });
  }
  revalidatePath(`/korean/learners/${learnerId}`);
  redirect(`/korean/learners/${learnerId}`);
}

function reviewActionValue(value: string): "confirm" | "modify" | "delete" {
  if (value === "modify" || value === "delete") return value;
  return "confirm";
}

export async function saveKoreanReview(submissionId: string, formData: FormData) {
  const submission = await db.submission.findFirst({
    where: { id: submissionId, patient: { serviceLine: KOREAN_SERVICE_LINE } },
    select: { id: true },
  });
  if (!submission) return;

  const differences = formData.getAll("difference").map(String).filter(Boolean);
  const reviews = Array.from({ length: 5 }, (_, index) => {
    const candidate = String(formData.get(`candidate-${index}`) ?? "").trim();
    const focus = String(formData.get(`focus-${index}`) ?? "").trim();
    const action = reviewActionValue(String(formData.get(`action-${index}`) ?? ""));
    return candidate && focus ? { candidate, focus, action } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const tutorMemo = String(formData.get("tutorMemo") ?? "").trim() || null;
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  const nextNote = String(formData.get("nextPracticeNote") ?? "").trim() || null;

  const meta: KoreanReviewMeta = {
    reference: {
      heardText: String(formData.get("heardText") ?? "").trim() || "규칙 기반 인식 후보 없음",
      differences,
      source: "규칙 기반 더미 참고",
    },
    pronunciationReviews: reviews,
    tutorMemo,
    nextPractice: {
      recommended: Boolean(nextNote),
      assigned: false,
      note: nextNote,
    },
  };

  await db.submission.update({
    where: { id: submissionId },
    data: {
      feedback,
      reviewOpinion: reviews.length > 0 ? "교사 피드백 작성" : "검수 완료",
      reviewMetaJson: JSON.stringify(meta),
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/korean/review");
}

