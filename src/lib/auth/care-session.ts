import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AppUserRole, AppUserStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const CARE_SESSION_COOKIE = "mg_care_session";
export const CARE_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export type CareSessionUser = {
  id: string;
  role: AppUserRole;
  status: AppUserStatus;
  displayName: string | null;
  loginId: string | null;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

// Server Component 렌더링 중에는 쿠키를 수정할 수 없어(Next.js 제약) 예외를 삼킨다.
// Route Handler/Server Action에서 호출되면 실제로 쿠키가 제거된다.
async function clearCareSessionCookieBestEffort(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(CARE_SESSION_COOKIE);
  } catch {
    // no-op: read-only(Server Component) 컨텍스트
  }
}

export async function createCareSession(userId: string): Promise<void> {
  const user = await db.appUser.findUniqueOrThrow({
    where: { id: userId },
    select: { authVersion: true },
  });

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + CARE_SESSION_DURATION_MS);

  await db.careAuthSession.create({
    data: {
      userId,
      tokenHash,
      authVersion: user.authVersion,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(CARE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionEnv(),
    path: "/",
    maxAge: Math.floor(CARE_SESSION_DURATION_MS / 1000),
  });
}

export async function getCareSession(): Promise<CareSessionUser | null> {
  const jar = await cookies();
  const token = jar.get(CARE_SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.careAuthSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    await clearCareSessionCookieBestEffort();
    return null;
  }

  const isExpiredOrInvalid =
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= Date.now() ||
    session.user.status !== "ACTIVE" ||
    session.authVersion !== session.user.authVersion;

  if (isExpiredOrInvalid) {
    await clearCareSessionCookieBestEffort();
    return null;
  }

  return {
    id: session.user.id,
    role: session.user.role,
    status: session.user.status,
    displayName: session.user.displayName,
    loginId: session.user.loginId,
  };
}

export async function getCurrentCareUser(): Promise<CareSessionUser | null> {
  return getCareSession();
}

export async function destroyCareSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CARE_SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await db.careAuthSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  jar.delete(CARE_SESSION_COOKIE);
}

export async function requireCareUser(): Promise<CareSessionUser> {
  const user = await getCareSession();
  if (!user) {
    redirect("/care/login");
  }
  return user;
}

export async function requireCareRole(allowedRoles: AppUserRole[]): Promise<CareSessionUser> {
  const user = await requireCareUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/care/unauthorized");
  }
  return user;
}

export function getCareRoleHome(role: AppUserRole): string {
  switch (role) {
    case "PATIENT":
      return "/care/patient";
    case "CAREGIVER":
      return "/care/caregiver";
    case "THERAPIST":
      return "/care/therapist";
    case "ADMIN":
      return "/care/admin";
    default:
      return "/care/unauthorized";
  }
}
