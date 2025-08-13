-- AlterTable
ALTER TABLE "public"."GroupLists" ADD COLUMN     "updated_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "public"."Invitations" ADD COLUMN     "group_name" VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."UserLists" ADD COLUMN     "updated_at" TIMESTAMPTZ;
