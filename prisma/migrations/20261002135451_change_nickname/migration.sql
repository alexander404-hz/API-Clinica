/*
  Warnings:

  - You are about to drop the column `nickname` on the `Patient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "nickname",
ADD COLUMN     "preferredName" TEXT;
