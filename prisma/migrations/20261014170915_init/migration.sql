/*
  Warnings:

  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('SPECTATOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "TypePrice" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE');

-- CreateEnum
CREATE TYPE "PointLotStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_USED', 'FULLY_USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('WAITING_FOR_PAYMENT', 'WAITING_FOR_CONFIRMATION', 'PAID', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProofDecision" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'VOID');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password",
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "referredByUserId" TEXT,
ALTER COLUMN "username" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "costumerProfiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullname" VARCHAR(100) NOT NULL,
    "phoneNumber" INTEGER NOT NULL,
    "avatarUrl" VARCHAR(500) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "costumerProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer-profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationName" VARCHAR(150) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizer-profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "location" VARCHAR(300) NOT NULL,
    "format" "EventFormat" NOT NULL,
    "typePrice" "TypePrice" NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "quota" INTEGER NOT NULL,
    "startstAt" TIMESTAMP(3),
    "EndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event-voucher" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discountPercentage" DECIMAL NOT NULL,
    "quota" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "event-voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercentage" DECIMAL(65,30) NOT NULL,
    "quota" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point-lots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "referredUserId" TEXT,
    "pointsRemaining" INTEGER NOT NULL,
    "status" "PointLotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "creditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "point-lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer-bank-accounts" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "bankName" VARCHAR(50) NOT NULL,
    "accountNumber" INTEGER NOT NULL,
    "accountHolder" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizer-bank-accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventVoucherId" TEXT,
    "userCouponId" TEXT,
    "quantity" INTEGER NOT NULL,
    "ticketPrice" DECIMAL(15,2) NOT NULL,
    "transactionCode" VARCHAR(50) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "voucherDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "couponDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pointUsed" INTEGER NOT NULL DEFAULT 0,
    "pointDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(15,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'WAITING_FOR_PAYMENT',
    "paymentDeadline" TIMESTAMP(3),
    "confirmationDeadline" TIMESTAMP(3),
    "submittedProofAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment-proofs" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "storagePath" VARCHAR(500) NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "decision" "PaymentProofDecision" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payment-proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "transactionsId" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "events_typePrice_idx" ON "events"("typePrice");

-- CreateIndex
CREATE INDEX "events_format_idx" ON "events"("format");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");

-- CreateIndex
CREATE INDEX "events_organizerId_idx" ON "events"("organizerId");

-- CreateIndex
CREATE INDEX "events_categoryId_idx" ON "events"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "event-voucher_eventId_code_key" ON "event-voucher"("eventId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "point-lots_user_id_expiresAt_idx" ON "point-lots"("user_id", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionCode_key" ON "transactions"("transactionCode");

-- CreateIndex
CREATE INDEX "transactions_customerId_idx" ON "transactions"("customerId");

-- CreateIndex
CREATE INDEX "transactions_eventId_idx" ON "transactions"("eventId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costumerProfiles" ADD CONSTRAINT "costumerProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer-profiles" ADD CONSTRAINT "organizer-profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "organizer-profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event-voucher" ADD CONSTRAINT "event-voucher_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point-lots" ADD CONSTRAINT "point-lots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point-lots" ADD CONSTRAINT "point-lots_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer-bank-accounts" ADD CONSTRAINT "organizer-bank-accounts_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "organizer-profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "organizer-bank-accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_eventVoucherId_fkey" FOREIGN KEY ("eventVoucherId") REFERENCES "event-voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userCouponId_fkey" FOREIGN KEY ("userCouponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment-proofs" ADD CONSTRAINT "payment-proofs_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment-proofs" ADD CONSTRAINT "payment-proofs_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_transactionsId_fkey" FOREIGN KEY ("transactionsId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
