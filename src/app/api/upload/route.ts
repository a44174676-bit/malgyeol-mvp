import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { buildObservationMemo } from "@/lib/training-data";

// 서버 실행 위치와 무관하게 프로젝트 루트 기준 (UPLOAD_DIR 환경변수로 재정의 가능)
const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

function asNumber(value: unknown, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function famIntelFrom(value: unknown) {
  if (value === "예") return 5;
  if (value === "보통") return 3;
  if (value === "아니오") return 1;
  return null;
}

function repeatFrom(value: unknown) {
  if (value === "예") return "자주";
  if (value === "비슷함") return "가끔";
  if (value === "아니오") return "없음";
  return null;
}

function phoneFrom(value: unknown) {
  if (value === "예") return "어려움";
  if (value === "조금") return "짧게 가능";
  if (value === "아니오") return "가능";
  return null;
}

function str(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  const itemId = String(form.get("itemId") ?? "");
  const file = form.get("file");

  if (!token || !itemId || !(file instanceof File)) {
    return new NextResponse("잘못된 요청입니다.", { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return new NextResponse("파일 크기가 올바르지 않습니다.", { status: 400 });
  }

  const item = await db.prescriptionItem.findUnique({
    where: { id: itemId },
    include: { activity: true, prescription: { include: { patient: true } } },
  });
  if (!item || item.prescription.patient.portalToken !== token) {
    return new NextResponse("권한이 없습니다.", { status: 403 });
  }

  // 단말에서 산출된 비진단 음성지표 수신 (온디바이스 산출)
  const metricsJson = String(form.get("metricsJson") ?? "") || null;
  const qualityFlag = String(form.get("qualityFlag") ?? "") || null;
  const homeTrainingContextJson = String(form.get("homeTrainingContextJson") ?? "");
  let homeTrainingContext: {
    selfAssessment?: Record<string, string>;
    caregiverObs?: Record<string, string>;
  } = {};
  try {
    homeTrainingContext = homeTrainingContextJson ? JSON.parse(homeTrainingContextJson) : {};
  } catch {
    homeTrainingContext = {};
  }
  const self = homeTrainingContext.selfAssessment ?? {};
  const caregiver = homeTrainingContext.caregiverObs ?? {};
  const observationMemo = buildObservationMemo({
    speechCondition: asNumber(self.condition, 1, 5),
    tiredAfterSpeaking: str(caregiver.tiredAfterSpeaking),
    caregiverMemo: str(caregiver.memo),
    source: "record-submit",
  });

  const submission = await db.submission.create({
    data: {
      patientId: item.prescription.patientId,
      itemId: item.id,
      targetText: item.activity.targetText,
      metricsJson,
      qualityFlag,
    },
  });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, `${submission.id}.webm`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  await db.$transaction([
    db.submission.update({
      where: { id: submission.id },
      data: { audioPath: filePath },
    }),
    db.observationEntry.create({
      data: {
        patientId: item.prescription.patientId,
        fatigue: asNumber(self.fatigue, 0, 10),
        selfIntel: asNumber(self.fluency, 1, 5),
        famIntel: famIntelFrom(caregiver.easyToUnderstand),
        repeatQ: repeatFrom(caregiver.repeatIncreased),
        phoneCall: phoneFrom(caregiver.phoneDifficult),
        cough: str(caregiver.coughDuringMeal),
        memo: observationMemo,
      },
    }),
    db.prescriptionItem.update({
      where: { id: item.id },
      data: { status: "DONE" },
    }),
  ]);

  return NextResponse.json({ ok: true, submissionId: submission.id });
}
