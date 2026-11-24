-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_focus_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activeUserId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'work',
    "startedAt" BIGINT NOT NULL,
    "plannedEndAt" BIGINT NOT NULL,
    "endedAt" BIGINT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "focus_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_focus_session" ("activeUserId", "createdAt", "endedAt", "id", "plannedEndAt", "startedAt", "status", "userId") SELECT "activeUserId", "createdAt", "endedAt", "id", "plannedEndAt", "startedAt", "status", "userId" FROM "focus_session";
DROP TABLE "focus_session";
ALTER TABLE "new_focus_session" RENAME TO "focus_session";
CREATE UNIQUE INDEX "focus_session_activeUserId_key" ON "focus_session"("activeUserId");
CREATE INDEX "focus_session_userId_startedAt_idx" ON "focus_session"("userId", "startedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
