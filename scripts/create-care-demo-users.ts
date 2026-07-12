import { PrismaClient } from "@prisma/client";
import type { AppUserRole } from "@prisma/client";
import { hashCarePassword } from "../src/lib/auth/care-password";

const prisma = new PrismaClient();

type DemoAccountKey = "patient" | "caregiver" | "therapist" | "admin";

type DemoAccount = {
  key: DemoAccountKey;
  loginId: string;
  role: AppUserRole;
  displayName: string;
  passwordEnvVar: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: "patient",
    loginId: "demo-patient",
    role: "PATIENT",
    displayName: "데모 환자",
    passwordEnvVar: "CARE_DEMO_PATIENT_PASSWORD",
  },
  {
    key: "caregiver",
    loginId: "demo-caregiver",
    role: "CAREGIVER",
    displayName: "데모 보호자",
    passwordEnvVar: "CARE_DEMO_CAREGIVER_PASSWORD",
  },
  {
    key: "therapist",
    loginId: "demo-therapist",
    role: "THERAPIST",
    displayName: "데모 언어재활사",
    passwordEnvVar: "CARE_DEMO_THERAPIST_PASSWORD",
  },
  {
    key: "admin",
    loginId: "demo-admin",
    role: "ADMIN",
    displayName: "데모 관리자",
    passwordEnvVar: "CARE_DEMO_ADMIN_PASSWORD",
  },
];

function assertNotProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("production 환경에서는 데모 계정 생성 스크립트를 실행할 수 없습니다.");
  }
}

function readRequiredPasswords(): Record<DemoAccountKey, string> {
  const missing: string[] = [];
  const passwords = {} as Record<DemoAccountKey, string>;

  for (const account of DEMO_ACCOUNTS) {
    const value = process.env[account.passwordEnvVar];
    if (!value) {
      missing.push(account.passwordEnvVar);
      continue;
    }
    passwords[account.key] = value;
  }

  if (missing.length > 0) {
    throw new Error(`다음 환경변수가 설정되지 않았습니다: ${missing.join(", ")}`);
  }

  return passwords;
}

async function upsertDemoUser(account: DemoAccount, password: string) {
  const passwordHash = await hashCarePassword(password);

  const user = await prisma.appUser.upsert({
    where: { loginId: account.loginId },
    create: {
      loginId: account.loginId,
      role: account.role,
      displayName: account.displayName,
      status: "ACTIVE",
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
    update: {
      role: account.role,
      displayName: account.displayName,
      status: "ACTIVE",
      passwordHash,
      passwordUpdatedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
      authVersion: { increment: 1 },
    },
    select: { id: true, loginId: true, role: true },
  });

  if (account.role === "PATIENT") {
    await prisma.carePatientProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, alias: account.displayName, status: "ACTIVE" },
      update: { alias: account.displayName, status: "ACTIVE" },
    });
  }

  if (account.role === "THERAPIST") {
    await prisma.careTherapistProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, displayName: account.displayName, status: "ACTIVE" },
      update: { displayName: account.displayName, status: "ACTIVE" },
    });
  }

  return user;
}

async function main() {
  assertNotProduction();
  const passwords = readRequiredPasswords();

  for (const account of DEMO_ACCOUNTS) {
    const user = await upsertDemoUser(account, passwords[account.key]);
    console.log(`ok: ${user.loginId} (${user.role}) -> ${user.id}`);
  }
}

main()
  .catch((error) => {
    console.error("failed to create care demo users");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
