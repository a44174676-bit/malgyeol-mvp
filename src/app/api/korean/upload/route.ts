import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { KOREAN_SERVICE_LINE } from "@/lib/korean-copy";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_BYTES = 20 * 1024 * 1024;

function asNumber(value: unknown, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
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
    return new NextResponse("녹음 파일 크기를 확인해 주세요.", { status: 400 });
  }

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
    return new NextResponse("권한이 없습니다.", { status: 403 });
  }

  const metricsJson = String(form.get("metricsJson") ?? "") || null;
  const qualityFlag = String(form.get("qualityFlag") ?? "") || null;
  const selfJson = String(form.get("selfAssessmentJson") ?? "");
  let self: Record<string, string> = {};
  try {
    self = selfJson ? JSON.parse(selfJson) : {};
  } catch {
    self = {};
  }

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
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  await db.$transaction([
    db.submission.update({
      where: { id: submission.id },
      data: { audioPath: filePath },
    }),
    db.observationEntry.create({
      data: {
        patientId: item.prescription.patientId,
        fatigue: asNumber(self.tiredness, 0, 10),
        selfIntel: asNumber(self.confidence, 1, 5),
        memo: JSON.stringify({
          source: "korean-record",
          difficulty: asNumber(self.difficulty, 1, 5),
          memo: typeof self.memo === "string" ? self.memo : "",
        }),
      },
    }),
    db.prescriptionItem.update({
      where: { id: item.id },
      data: { status: "DONE" },
    }),
  ]);

  return NextResponse.json({ ok: true, submissionId: submission.id });
}
