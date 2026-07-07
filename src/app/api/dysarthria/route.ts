import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import type { BatteryResult } from "@/lib/battery";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_BYTES = 30 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = request.cookies.get("mg_session")?.value;
  if (session !== process.env.APP_PASSWORD) {
    return new NextResponse("권한이 없습니다.", { status: 403 });
  }

  const form = await request.formData();
  const patientId = String(form.get("patientId") ?? "");
  let results: BatteryResult[];
  try {
    results = JSON.parse(String(form.get("resultsJson") ?? ""));
    if (!Array.isArray(results) || results.length === 0) throw new Error();
  } catch {
    return new NextResponse("결과 데이터가 올바르지 않습니다.", { status: 400 });
  }

  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) return new NextResponse("환자를 찾을 수 없습니다.", { status: 404 });

  const test = await db.dysarthriaTest.create({
    data: { patientId, resultsJson: JSON.stringify(results) },
  });

  const audioDir = path.join(UPLOAD_DIR, "dysarthria");
  let hasAudio = false;
  for (let i = 0; i < results.length; i++) {
    const file = form.get(`audio-${i}`);
    if (file instanceof File && file.size > 0 && file.size <= MAX_BYTES) {
      if (!hasAudio) {
        await mkdir(audioDir, { recursive: true });
        hasAudio = true;
      }
      const filePath = path.join(audioDir, `${test.id}-${i}.webm`);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      results[i].audioPath = filePath;
    }
  }
  if (hasAudio) {
    await db.dysarthriaTest.update({
      where: { id: test.id },
      data: { resultsJson: JSON.stringify(results) },
    });
  }

  return NextResponse.json({ id: test.id });
}
