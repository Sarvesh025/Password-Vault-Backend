-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordDetails" (
    "id" SERIAL NOT NULL,
    "password" TEXT NOT NULL,
    "creationDate" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,

    CONSTRAINT "PasswordDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Password" (
    "userID" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "passwordName" TEXT NOT NULL,
    "passwordHistory" TEXT NOT NULL,
    "lastVisit" TEXT NOT NULL,

    CONSTRAINT "Password_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Password" ADD CONSTRAINT "Password_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
