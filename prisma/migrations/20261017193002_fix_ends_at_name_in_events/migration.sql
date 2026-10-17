/*
  Warnings:

  - You are about to drop the column `EndsAt` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "EndsAt",
ADD COLUMN     "endsAt" TIMESTAMP(3);
