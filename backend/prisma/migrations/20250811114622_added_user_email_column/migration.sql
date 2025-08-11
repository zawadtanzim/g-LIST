/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Groups" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Items" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Lists" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Users" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");
