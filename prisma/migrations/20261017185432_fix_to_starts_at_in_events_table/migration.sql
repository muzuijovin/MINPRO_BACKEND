/*
  Warnings:

  - You are about to drop the column `startstAt` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "startstAt",
ADD COLUMN     "startsAt" TIMESTAMP(3);
