/*
  Warnings:

  - You are about to drop the column `lastVisit` on the `Password` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHistory` on the `Password` table. All the data in the column will be lost.
  - You are about to drop the column `passwordName` on the `Password` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `Password` table. All the data in the column will be lost.
  - You are about to drop the `PasswordDetails` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category` to the `Password` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Password` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Password` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Password` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Password` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Password" DROP CONSTRAINT "Password_userID_fkey";

-- AlterTable
ALTER TABLE "Password" DROP COLUMN "lastVisit",
DROP COLUMN "passwordHistory",
DROP COLUMN "passwordName",
DROP COLUMN "userID",
ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "url" TEXT,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "PasswordDetails";

-- CreateTable
CREATE TABLE "PasswordHistory" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordId" INTEGER NOT NULL,

    CONSTRAINT "PasswordHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordHistory" ADD CONSTRAINT "PasswordHistory_passwordId_fkey" FOREIGN KEY ("passwordId") REFERENCES "Password"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
