-- CreateTable
CREATE TABLE "CareAuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "authVersion" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "CareAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "displayName" TEXT,
    "alias" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deactivatedAt" DATETIME,
    "loginId" TEXT,
    "passwordHash" TEXT,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastLoginAt" DATETIME,
    "passwordUpdatedAt" DATETIME,
    "authVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppUser" ("alias", "createdAt", "deactivatedAt", "displayName", "id", "role", "status", "updatedAt") SELECT "alias", "createdAt", "deactivatedAt", "displayName", "id", "role", "status", "updatedAt" FROM "AppUser";
DROP TABLE "AppUser";
ALTER TABLE "new_AppUser" RENAME TO "AppUser";
CREATE UNIQUE INDEX "AppUser_loginId_key" ON "AppUser"("loginId");
CREATE INDEX "AppUser_role_status_idx" ON "AppUser"("role", "status");
CREATE INDEX "AppUser_createdAt_idx" ON "AppUser"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CareAuthSession_tokenHash_key" ON "CareAuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "CareAuthSession_userId_expiresAt_idx" ON "CareAuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "CareAuthSession_expiresAt_idx" ON "CareAuthSession"("expiresAt");
