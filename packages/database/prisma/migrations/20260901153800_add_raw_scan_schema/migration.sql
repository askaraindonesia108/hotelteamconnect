-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalRead" INTEGER NOT NULL DEFAULT 0,
    "totalValid" INTEGER NOT NULL DEFAULT 0,
    "totalInvalid" INTEGER NOT NULL DEFAULT 0,
    "totalDuplicate" INTEGER NOT NULL DEFAULT 0,
    "totalInserted" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRowError" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" TEXT,
    "errorMessage" TEXT NOT NULL,

    CONSTRAINT "ImportRowError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawScan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "employeePin" TEXT NOT NULL,
    "scannedAtUtc" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT,
    "verifyMode" TEXT,
    "inOutState" TEXT,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RawScan_propertyId_employeePin_scannedAtUtc_idx" ON "RawScan"("propertyId", "employeePin", "scannedAtUtc");

-- CreateIndex
CREATE UNIQUE INDEX "RawScan_propertyId_sourceType_sourceRecordId_key" ON "RawScan"("propertyId", "sourceType", "sourceRecordId");

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRowError" ADD CONSTRAINT "ImportRowError_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawScan" ADD CONSTRAINT "RawScan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawScan" ADD CONSTRAINT "RawScan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
