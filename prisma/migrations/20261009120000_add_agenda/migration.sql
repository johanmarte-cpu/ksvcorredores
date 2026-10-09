-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "notifyTaskDigest" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "remindAt" TIMESTAMP(3),
ADD COLUMN     "reminderDismissedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "agenda_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agenda_notes_userId_idx" ON "agenda_notes"("userId");

-- CreateIndex
CREATE INDEX "tasks_assignedToId_status_idx" ON "tasks"("assignedToId", "status");

-- AddForeignKey
ALTER TABLE "agenda_notes" ADD CONSTRAINT "agenda_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

