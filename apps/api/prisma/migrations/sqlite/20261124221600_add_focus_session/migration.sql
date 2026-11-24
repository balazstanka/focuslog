-- CreateTable
CREATE TABLE "focus_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activeUserId" TEXT,
    "startedAt" BIGINT NOT NULL,
    "plannedEndAt" BIGINT NOT NULL,
    "endedAt" BIGINT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "focus_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_pause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "startedAt" BIGINT NOT NULL,
    "endedAt" BIGINT,
    CONSTRAINT "session_pause_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "focus_session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "focus_session_activeUserId_key" ON "focus_session"("activeUserId");

-- CreateIndex
CREATE INDEX "focus_session_userId_startedAt_idx" ON "focus_session"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "session_pause_sessionId_idx" ON "session_pause"("sessionId");
