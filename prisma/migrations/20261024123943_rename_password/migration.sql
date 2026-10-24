/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `costumerProfiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `organizer-profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nik]` on the table `organizer-profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[npwp]` on the table `organizer-profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessAddress` to the `organizer-profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `organizer-profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nik` to the `organizer-profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `organizer-profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizer-profiles" ADD COLUMN     "businessAddress" VARCHAR(500) NOT NULL,
ADD COLUMN     "businessEmail" VARCHAR(255),
ADD COLUMN     "fullName" VARCHAR(100) NOT NULL,
ADD COLUMN     "nik" VARCHAR(16) NOT NULL,
ADD COLUMN     "npwp" VARCHAR(25),
ADD COLUMN     "phoneNumber" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "passwordHash",
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "costumerProfiles_userId_key" ON "costumerProfiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organizer-profiles_userId_key" ON "organizer-profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organizer-profiles_nik_key" ON "organizer-profiles"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "organizer-profiles_npwp_key" ON "organizer-profiles"("npwp");
