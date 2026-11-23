-- CreateTable
CREATE TABLE "focus_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" BIGINT NOT NULL,
    "plannedEndAt" BIGINT NOT NULL,
    "endedAt" BIGINT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "focus_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "focus_session_userId_idx" ON "focus_session"("userId");
