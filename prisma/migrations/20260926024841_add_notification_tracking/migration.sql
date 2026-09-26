-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "lastBirthdayEmailYear" INTEGER;

-- AlterTable
ALTER TABLE "policies" ADD COLUMN     "renewalNoticeSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "policy_payments" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
