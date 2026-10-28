/*
  Warnings:

  - You are about to drop the column `businessEmail` on the `organizer-profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nib]` on the table `organizer-profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organizer-profiles" DROP COLUMN "businessEmail",
ADD COLUMN     "logoUrl" VARCHAR(500),
ADD COLUMN     "nib" VARCHAR(13);

-- CreateIndex
CREATE UNIQUE INDEX "organizer-profiles_nib_key" ON "organizer-profiles"("nib");
