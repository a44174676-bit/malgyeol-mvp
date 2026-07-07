import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { analyzeTest, type TestItem } from "@/lib/phonology";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // 치료사 세션 필수
  const session = request.cookies.get("mg_session")?.value;
  if (session !== process.env.APP_PASSWORD) {
    return new NextResponse("권한이 없습니다.", { status: 403 });
  }

  const form = await request.formData();
  const patientId = String(form.get("patientId") ?? "");
  const level = String(form.get("level") ?? "") === "SENTENCE" ? "SENTENCE" : "WORD";
  let items: TestItem[];
  try {
    items = JSON.parse(String(form.get("itemsJson") ?? ""));
    if (!Array.isArray(items) || items.length === 0) throw new Error();
  } catch {
    return new NextResponse("문항 데이터가 올바르지 않습니다.", { status: 400 });
  }

  const patient = await db.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    return new NextResponse("환자를 찾을 수 없습니다.", { status: 404 });
  }

  const result = analyzeTest(items);
  const test = await db.articulationTest.create({
    data: {
      patientId,
      level,
      itemsJson: JSON.stringify(items),
      resultJson: JSON.stringify(result),
    },
  });

  // 문항별 녹음 저장
  const audioDir = path.join(UPLOAD_DIR, "assessments");
  let hasAudio = false;
  for (let i = 0; i < items.length; i++) {
    const file = form.get(`audio-${i}`);
    if (file instanceof File && file.size > 0 && file.size <= MAX_BYTES) {
      if (!hasAudio) {
        await mkdir(audioDir, { recursive: true });
        hasAudio = true;
      }
      const filePath = path.join(audioDir, `${test.id}-${i}.webm`);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      items[i].audioPath = filePath;
    }
  }
  if (hasAudio) {
    await db.articulationTest.update({
      where: { id: test.id },
      data: { itemsJson: JSON.stringify(items) },
    });
  }

  return NextResponse.json({ id: test.id });
}
