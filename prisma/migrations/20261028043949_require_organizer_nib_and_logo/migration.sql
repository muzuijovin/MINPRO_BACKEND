/*
  Warnings:

  - Made the column `logoUrl` on table `organizer-profiles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nib` on table `organizer-profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "organizer-profiles" ALTER COLUMN "logoUrl" SET NOT NULL,
ALTER COLUMN "nib" SET NOT NULL;
