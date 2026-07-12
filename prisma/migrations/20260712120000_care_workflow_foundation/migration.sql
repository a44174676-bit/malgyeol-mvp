-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "displayName" TEXT,
    "alias" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deactivatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CarePatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "legacyPatientId" TEXT,
    "patientCode" TEXT,
    "alias" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarePatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CarePatientProfile_legacyPatientId_fkey" FOREIGN KEY ("legacyPatientId") REFERENCES "Patient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareTherapistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "therapistType" TEXT NOT NULL DEFAULT 'SPEECH_LANGUAGE_PATHOLOGIST',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareTherapistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientProfileId" TEXT NOT NULL,
    "therapistProfileId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareConnection_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "CarePatientProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CareConnection_therapistProfileId_fkey" FOREIGN KEY ("therapistProfileId") REFERENCES "CareTherapistProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdByTherapistId" TEXT NOT NULL,
    "patientProfileId" TEXT NOT NULL,
    "connectionId" TEXT,
    "taskType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetText" TEXT,
    "instructions" TEXT,
    "repetitionTarget" INTEGER,
    "assignedAt" DATETIME,
    "dueAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "previousTaskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareTask_createdByTherapistId_fkey" FOREIGN KEY ("createdByTherapistId") REFERENCES "CareTherapistProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CareTask_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "CarePatientProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CareTask_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CareConnection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CareTask_previousTaskId_fkey" FOREIGN KEY ("previousTaskId") REFERENCES "CareTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "careTaskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "audioMimeType" TEXT,
    "audioDurationSecond" REAL,
    "aiAnalysisConsent" BOOLEAN NOT NULL DEFAULT false,
    "expertSharingConsent" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareSubmission_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CareSubmission_careTaskId_fkey" FOREIGN KEY ("careTaskId") REFERENCES "CareTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutoAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "transcript" TEXT,
    "comparisonJson" TEXT,
    "acousticMetricsJson" TEXT,
    "modelName" TEXT,
    "analysisVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutoAnalysis_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpertReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "therapistProfileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "revisedTranscript" TEXT,
    "correctedRepetitionCount" INTEGER,
    "validity" TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
    "resubmissionRequested" BOOLEAN NOT NULL DEFAULT false,
    "internalMemo" TEXT,
    "patientVisibleComment" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpertReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpertReview_therapistProfileId_fkey" FOREIGN KEY ("therapistProfileId") REFERENCES "CareTherapistProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT,
    "submissionId" TEXT,
    "patientProfileId" TEXT NOT NULL,
    "therapistProfileId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "nextTaskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientFeedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ExpertReview" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientFeedback_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientFeedback_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "CarePatientProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PatientFeedback_therapistProfileId_fkey" FOREIGN KEY ("therapistProfileId") REFERENCES "CareTherapistProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientFeedback_nextTaskId_fkey" FOREIGN KEY ("nextTaskId") REFERENCES "CareTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "consentType" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "consentedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetModel" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "AppUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AppUser_role_status_idx" ON "AppUser"("role", "status");

-- CreateIndex
CREATE INDEX "AppUser_createdAt_idx" ON "AppUser"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CarePatientProfile_userId_key" ON "CarePatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CarePatientProfile_legacyPatientId_key" ON "CarePatientProfile"("legacyPatientId");

-- CreateIndex
CREATE UNIQUE INDEX "CarePatientProfile_patientCode_key" ON "CarePatientProfile"("patientCode");

-- CreateIndex
CREATE INDEX "CarePatientProfile_status_idx" ON "CarePatientProfile"("status");

-- CreateIndex
CREATE INDEX "CarePatientProfile_createdAt_idx" ON "CarePatientProfile"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CareTherapistProfile_userId_key" ON "CareTherapistProfile"("userId");

-- CreateIndex
CREATE INDEX "CareTherapistProfile_therapistType_status_idx" ON "CareTherapistProfile"("therapistType", "status");

-- CreateIndex
CREATE INDEX "CareTherapistProfile_createdAt_idx" ON "CareTherapistProfile"("createdAt");

-- CreateIndex
CREATE INDEX "CareConnection_patientProfileId_status_idx" ON "CareConnection"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "CareConnection_therapistProfileId_status_idx" ON "CareConnection"("therapistProfileId", "status");

-- CreateIndex
CREATE INDEX "CareConnection_startedAt_idx" ON "CareConnection"("startedAt");

-- CreateIndex
CREATE INDEX "CareTask_patientProfileId_status_idx" ON "CareTask"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "CareTask_createdByTherapistId_idx" ON "CareTask"("createdByTherapistId");

-- CreateIndex
CREATE INDEX "CareTask_connectionId_idx" ON "CareTask"("connectionId");

-- CreateIndex
CREATE INDEX "CareTask_dueAt_idx" ON "CareTask"("dueAt");

-- CreateIndex
CREATE INDEX "CareTask_createdAt_idx" ON "CareTask"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CareSubmission_submissionId_key" ON "CareSubmission"("submissionId");

-- CreateIndex
CREATE INDEX "CareSubmission_careTaskId_idx" ON "CareSubmission"("careTaskId");

-- CreateIndex
CREATE INDEX "CareSubmission_status_idx" ON "CareSubmission"("status");

-- CreateIndex
CREATE INDEX "CareSubmission_submittedAt_idx" ON "CareSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "CareSubmission_createdAt_idx" ON "CareSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "AutoAnalysis_submissionId_idx" ON "AutoAnalysis"("submissionId");

-- CreateIndex
CREATE INDEX "AutoAnalysis_status_idx" ON "AutoAnalysis"("status");

-- CreateIndex
CREATE INDEX "AutoAnalysis_completedAt_idx" ON "AutoAnalysis"("completedAt");

-- CreateIndex
CREATE INDEX "AutoAnalysis_createdAt_idx" ON "AutoAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "ExpertReview_submissionId_idx" ON "ExpertReview"("submissionId");

-- CreateIndex
CREATE INDEX "ExpertReview_therapistProfileId_idx" ON "ExpertReview"("therapistProfileId");

-- CreateIndex
CREATE INDEX "ExpertReview_status_idx" ON "ExpertReview"("status");

-- CreateIndex
CREATE INDEX "ExpertReview_completedAt_idx" ON "ExpertReview"("completedAt");

-- CreateIndex
CREATE INDEX "ExpertReview_createdAt_idx" ON "ExpertReview"("createdAt");

-- CreateIndex
CREATE INDEX "PatientFeedback_patientProfileId_status_idx" ON "PatientFeedback"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "PatientFeedback_therapistProfileId_idx" ON "PatientFeedback"("therapistProfileId");

-- CreateIndex
CREATE INDEX "PatientFeedback_submissionId_idx" ON "PatientFeedback"("submissionId");

-- CreateIndex
CREATE INDEX "PatientFeedback_reviewId_idx" ON "PatientFeedback"("reviewId");

-- CreateIndex
CREATE INDEX "PatientFeedback_nextTaskId_idx" ON "PatientFeedback"("nextTaskId");

-- CreateIndex
CREATE INDEX "PatientFeedback_sentAt_idx" ON "PatientFeedback"("sentAt");

-- CreateIndex
CREATE INDEX "PatientFeedback_createdAt_idx" ON "PatientFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_consentType_idx" ON "ConsentRecord"("userId", "consentType");

-- CreateIndex
CREATE INDEX "ConsentRecord_consentedAt_idx" ON "ConsentRecord"("consentedAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_targetModel_targetId_idx" ON "AuditLog"("targetModel", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_patientId_idx" ON "Submission"("patientId");

-- CreateIndex
CREATE INDEX "Submission_itemId_idx" ON "Submission"("itemId");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");
