import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 치료사 세션에서만 재생 가능
  const session = request.cookies.get("mg_session")?.value;
  if (session !== process.env.APP_PASSWORD) {
    return new NextResponse("권한이 없습니다.", { status: 403 });
  }

  const { id } = await params;
  const submission = await db.submission.findUnique({ where: { id } });
  if (!submission?.audioPath) {
    return new NextResponse("파일이 없습니다.", { status: 404 });
  }
  try {
    const data = await readFile(submission.audioPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "audio/webm",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("파일을 읽을 수 없습니다.", { status: 404 });
  }
}
