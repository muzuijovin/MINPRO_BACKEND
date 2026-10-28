-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_PROOF_UPLOADED', 'PAYMENT_ACCEPTED', 'PAYMENT_REJECTED', 'TRANSACTION_EXPIRED', 'TRANSACTION_CANCELLED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
