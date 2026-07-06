-- CreateEnum
CREATE TYPE "Province" AS ENUM ('AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('HOURLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('NATIVE', 'FEED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REMOVED');

-- CreateEnum
CREATE TYPE "FraudReportReason" AS ENUM ('SCAM_OR_PHISHING', 'FAKE_COMPANY', 'PYRAMID_OR_MLM', 'DISCRIMINATORY', 'ALREADY_FILLED', 'DUPLICATE_POSTING', 'OTHER');

-- CreateEnum
CREATE TYPE "FraudReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "city" TEXT,
    "province" "Province",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "workArrangement" "WorkArrangement" NOT NULL,
    "city" TEXT,
    "province" "Province",
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "salaryPeriod" "SalaryPeriod",
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "compensationText" TEXT,
    "aiScreeningUsed" BOOLEAN NOT NULL DEFAULT false,
    "aiScreeningDetails" TEXT,
    "applyUrl" TEXT,
    "applyEmail" TEXT,
    "source" "JobSource" NOT NULL DEFAULT 'NATIVE',
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudReport" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reason" "FraudReportReason" NOT NULL,
    "details" TEXT,
    "reporterEmail" TEXT,
    "status" "FraudReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_slug_idx" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");

-- CreateIndex
CREATE INDEX "Job_status_postedAt_idx" ON "Job"("status", "postedAt");

-- CreateIndex
CREATE INDEX "Job_category_idx" ON "Job"("category");

-- CreateIndex
CREATE INDEX "Job_province_city_idx" ON "Job"("province", "city");

-- CreateIndex
CREATE INDEX "Job_employmentType_idx" ON "Job"("employmentType");

-- CreateIndex
CREATE INDEX "Job_workArrangement_idx" ON "Job"("workArrangement");

-- CreateIndex
CREATE INDEX "FraudReport_jobId_idx" ON "FraudReport"("jobId");

-- CreateIndex
CREATE INDEX "FraudReport_status_idx" ON "FraudReport"("status");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudReport" ADD CONSTRAINT "FraudReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
