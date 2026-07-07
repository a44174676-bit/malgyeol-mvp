import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { db } from "@/lib/db";
import type { TestItem } from "@/lib/phonology";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string; idx: string }> }
) {
  const session = request.cookies.get("mg_session")?.value;
  if (session !== process.env.APP_PASSWORD) {
    return new NextResponse("권한이 없습니다.", { status: 403 });
  }

  const { testId, idx } = await params;
  const test = await db.articulationTest.findUnique({ where: { id: testId } });
  if (!test) return new NextResponse("검사를 찾을 수 없습니다.", { status: 404 });

  const items: TestItem[] = JSON.parse(test.itemsJson);
  const audioPath = items[Number(idx)]?.audioPath;
  if (!audioPath) return new NextResponse("녹음이 없습니다.", { status: 404 });

  try {
    const data = await readFile(audioPath);
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
