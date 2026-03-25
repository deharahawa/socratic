-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('GREENFIELD', 'INCIDENT');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('LOCKED', 'DISCOVERY', 'HANDS_ON', 'VALIDATION', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "compute_credits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_xp" INTEGER NOT NULL,
    "core_concepts" TEXT[],
    "type" "ProjectType" NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "big_picture" TEXT NOT NULL,
    "architect_mindset" TEXT NOT NULL,
    "definition_of_done" TEXT[],
    "order" INTEGER NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL,
    "delegation_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "user_report" TEXT NOT NULL,
    "system_logs" TEXT NOT NULL,

    CONSTRAINT "IncidentData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XP_Log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "concept_tag" TEXT NOT NULL,

    CONSTRAINT "XP_Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Quest_projectId_idx" ON "Quest"("projectId");

-- CreateIndex
CREATE INDEX "UserQuestProgress_userId_idx" ON "UserQuestProgress"("userId");

-- CreateIndex
CREATE INDEX "UserQuestProgress_questId_idx" ON "UserQuestProgress"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "UserQuestProgress_userId_questId_key" ON "UserQuestProgress"("userId", "questId");

-- CreateIndex
CREATE INDEX "IncidentData_projectId_idx" ON "IncidentData"("projectId");

-- CreateIndex
CREATE INDEX "XP_Log_userId_idx" ON "XP_Log"("userId");

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentData" ADD CONSTRAINT "IncidentData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XP_Log" ADD CONSTRAINT "XP_Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
