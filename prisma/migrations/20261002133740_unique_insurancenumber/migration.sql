/*
  Warnings:

  - A unique constraint covering the columns `[insuranceNumber]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Patient_insuranceNumber_key" ON "Patient"("insuranceNumber");
