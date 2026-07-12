import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { destroyCareSession, getCareSession } from "@/lib/auth/care-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getCareSession();

  await destroyCareSession();

  if (user) {
    await db.auditLog.create({
      data: {
        actorUserId: user.id,
        actionType: "CARE_LOGOUT",
        targetModel: "AppUser",
        targetId: user.id,
      },
    });
  }

  const url = new URL("/care/login", request.url);
  return NextResponse.redirect(url, 303);
}
