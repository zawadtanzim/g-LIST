/*
  Warnings:

  - The primary key for the `GroupMembers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserLists` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."GroupMembers" DROP CONSTRAINT "GroupMembers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invitations" DROP CONSTRAINT "Invitations_from_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invitations" DROP CONSTRAINT "Invitations_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Items" DROP CONSTRAINT "Items_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserLists" DROP CONSTRAINT "UserLists_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."GroupMembers" DROP CONSTRAINT "GroupMembers_pkey",
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "GroupMembers_pkey" PRIMARY KEY ("user_id", "group_id");

-- AlterTable
ALTER TABLE "public"."Invitations" ALTER COLUMN "from_user_id" SET DATA TYPE TEXT,
ALTER COLUMN "to_user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Items" ALTER COLUMN "user_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."UserLists" DROP CONSTRAINT "UserLists_pkey",
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserLists_pkey" PRIMARY KEY ("user_id", "list_id");

-- AlterTable
ALTER TABLE "public"."Users" DROP CONSTRAINT "Users_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Users_id_seq";

-- AddForeignKey
ALTER TABLE "public"."Items" ADD CONSTRAINT "Items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitations" ADD CONSTRAINT "Invitations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitations" ADD CONSTRAINT "Invitations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLists" ADD CONSTRAINT "UserLists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMembers" ADD CONSTRAINT "GroupMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
