/*
  Warnings:

  - You are about to drop the column `created_by` on the `Items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."GroupLists" ALTER COLUMN "interval_time" SET DEFAULT '18:00:00'::time;

-- AlterTable
ALTER TABLE "public"."Invitations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL  '7 days';

-- AlterTable
ALTER TABLE "public"."Items" DROP COLUMN "created_by";

-- AlterTable
ALTER TABLE "public"."UserLists" ALTER COLUMN "interval_time" SET DEFAULT '18:00:00'::time;
