"use server";

import { db } from "@/lib/db";
import { normalizeReviewAction, type ReviewMeta } from "@/lib/training-data";
import { revalidatePath } from "next/cache";

/** 치료사 검수 저장 — 판정(조음 과제)·검수 의견·피드백 (특허 단계 ⑤) */
export async function judgeSubmission(submissionId: string, formData: FormData) {
  const judgment = String(formData.get("judgment") ?? "");
  const reviewOpinion = String(formData.get("reviewOpinion") ?? "") || null;
  const feedback = String(formData.get("feedback") ?? "") || null;
  const therapistMemo = String(formData.get("therapistMemo") ?? "").trim() || null;
  const aiSttText = String(formData.get("aiSttText") ?? "").trim();
  const mismatches = formData
    .getAll("aiMismatch")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const errorReviews = Array.from({ length: 8 }, (_, idx) => {
    const candidate = String(formData.get(`errorCandidate-${idx}`) ?? "").trim();
    const errorType = String(formData.get(`errorType-${idx}`) ?? "").trim();
    const action = normalizeReviewAction(String(formData.get(`errorAction-${idx}`) ?? ""));
    return candidate && errorType ? { candidate, errorType, action } : null;
  }).filter((v): v is NonNullable<typeof v> => v !== null);
  const nextTaskRecommended = String(formData.get("nextTaskRecommended") ?? "") === "true";
  const nextTaskNote = String(formData.get("nextTaskNote") ?? "").trim() || null;
  const reviewMeta: ReviewMeta = {
    aiReference: {
      sttText: aiSttText || "더미 STT 후보 없음",
      mismatches,
      source: "AI 참고 분석 Beta - 규칙 기반 더미",
    },
    errorReviews,
    therapistMemo,
    nextTask: {
      recommended: nextTaskRecommended,
      assigned: false,
      note: nextTaskNote,
    },
  };
  const validJudgment = ["CORRECT", "APPROX", "WRONG"].includes(judgment)
    ? judgment
    : null;
  if (!validJudgment && !reviewOpinion && !feedback && !therapistMemo && errorReviews.length === 0) return;
  await db.submission.update({
    where: { id: submissionId },
    data: {
      ...(validJudgment ? { judgment: validJudgment } : {}),
      reviewOpinion,
      feedback,
      reviewMetaJson: JSON.stringify(reviewMeta),
      reviewedAt: new Date(),
    },
  });
  revalidatePath("/review");
  revalidatePath("/");
}
