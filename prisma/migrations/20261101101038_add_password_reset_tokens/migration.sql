/*
  Warnings:

  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- AlterTable
ALTER TABLE "organizer-bank-accounts" ALTER COLUMN "accountNumber" SET DATA TYPE VARCHAR(50);

-- DropTable
DROP TABLE "notifications";

-- DropEnum
DROP TYPE "NotificationType";

-- CreateTable
CREATE TABLE "password-reset-tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password-reset-tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password-reset-tokens_tokenHash_key" ON "password-reset-tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password-reset-tokens_userId_idx" ON "password-reset-tokens"("userId");

-- AddForeignKey
ALTER TABLE "password-reset-tokens" ADD CONSTRAINT "password-reset-tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
