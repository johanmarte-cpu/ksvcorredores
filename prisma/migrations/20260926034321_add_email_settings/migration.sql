-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "emailFromAddress" TEXT,
ADD COLUMN     "emailFromName" TEXT,
ADD COLUMN     "notifyBirthdays" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPaymentReminders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyRenewalNotices" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resendApiKey" TEXT;
