-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "smtpCredentialId" TEXT;

-- CreateTable
CREATE TABLE "SmtpCredential" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "username" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmtpCredential_workspaceId_idx" ON "SmtpCredential"("workspaceId");

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_smtpCredentialId_fkey" FOREIGN KEY ("smtpCredentialId") REFERENCES "SmtpCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmtpCredential" ADD CONSTRAINT "SmtpCredential_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
