-- AlterTable
ALTER TABLE "Job" ADD COLUMN "publicRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Job_publicRef_key" ON "Job"("publicRef");
