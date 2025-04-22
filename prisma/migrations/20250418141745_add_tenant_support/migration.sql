/*
  Warnings:

  - Added the required column `tenantId` to the `Password` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- Create default tenant
INSERT INTO "Tenant" ("name", "createdAt", "updatedAt") VALUES ('Default Tenant', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add tenantId columns with default value
ALTER TABLE "User" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Password" ADD COLUMN "tenantId" INTEGER NOT NULL DEFAULT 1;

-- Add foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Password" ADD CONSTRAINT "Password_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove default values after data is migrated
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP DEFAULT;
ALTER TABLE "Password" ALTER COLUMN "tenantId" DROP DEFAULT;
