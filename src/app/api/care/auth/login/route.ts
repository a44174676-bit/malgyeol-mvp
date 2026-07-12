import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  CARE_PASSWORD_MAX_LENGTH,
  CARE_PASSWORD_MIN_LENGTH,
  verifyCarePassword,
} from "@/lib/auth/care-password";
import { createCareSession, getCareRoleHome } from "@/lib/auth/care-session";

const LOGIN_ID_MAX_LENGTH = 100;
const FAILED_LOGIN_LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function loginFailureRedirect(request: NextRequest): NextResponse {
  const url = new URL("/care/login", request.url);
  url.searchParams.set("error", "1");
  return NextResponse.redirect(url, 303);
}

async function recordLoginAudit(
  actorUserId: string,
  actionType: "CARE_LOGIN_SUCCESS" | "CARE_LOGIN_FAILED"
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId,
      actionType,
      targetModel: "AppUser",
      targetId: actorUserId,
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return new NextResponse("잘못된 요청입니다.", { status: 403 });
  }

  const formData = await request.formData();
  const rawLoginId = String(formData.get("loginId") ?? "");
  const password = String(formData.get("password") ?? "");
  const loginId = rawLoginId.trim().toLowerCase();

  if (
    loginId.length < 1 ||
    loginId.length > LOGIN_ID_MAX_LENGTH ||
    password.length < CARE_PASSWORD_MIN_LENGTH ||
    password.length > CARE_PASSWORD_MAX_LENGTH
  ) {
    return loginFailureRedirect(request);
  }

  const user = await db.appUser.findUnique({ where: { loginId } });
  if (!user) {
    // loginId가 존재하지 않는 경우: 계정 존재 여부를 노출하지 않기 위해
    // 감사 로그를 남기지 않고(targetId 확보 불가) 동일한 실패 응답만 반환한다.
    return loginFailureRedirect(request);
  }

  if (user.status !== "ACTIVE") {
    await recordLoginAudit(user.id, "CARE_LOGIN_FAILED");
    return loginFailureRedirect(request);
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await recordLoginAudit(user.id, "CARE_LOGIN_FAILED");
    return loginFailureRedirect(request);
  }

  if (!user.passwordHash) {
    await recordLoginAudit(user.id, "CARE_LOGIN_FAILED");
    return loginFailureRedirect(request);
  }

  const passwordValid = await verifyCarePassword(password, user.passwordHash);
  if (!passwordValid) {
    const nextFailedCount = user.failedLoginCount + 1;
    await db.appUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: nextFailedCount,
        lockedUntil:
          nextFailedCount >= FAILED_LOGIN_LOCK_THRESHOLD
            ? new Date(Date.now() + LOCK_DURATION_MS)
            : user.lockedUntil,
      },
    });
    await recordLoginAudit(user.id, "CARE_LOGIN_FAILED");
    return loginFailureRedirect(request);
  }

  await db.appUser.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await createCareSession(user.id);
  await recordLoginAudit(user.id, "CARE_LOGIN_SUCCESS");

  const homeUrl = new URL(getCareRoleHome(user.role), request.url);
  return NextResponse.redirect(homeUrl, 303);
}
