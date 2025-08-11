-- CreateEnum
CREATE TYPE "public"."InvitationType" AS ENUM ('GROUP_INVITE', 'JOIN_REQUEST', 'START_GROUP');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Groups" ALTER COLUMN "group_image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Items" ALTER COLUMN "item_status" SET DEFAULT 'NEEDED';

-- AlterTable
ALTER TABLE "public"."Users" ALTER COLUMN "profile_pic" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Invitations" (
    "id" SERIAL NOT NULL,
    "type" "public"."InvitationType" NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" VARCHAR(255),
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "responded_at" TIMESTAMPTZ,

    CONSTRAINT "Invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invitations_to_user_id_status_idx" ON "public"."Invitations"("to_user_id", "status");

-- CreateIndex
CREATE INDEX "Invitations_from_user_id_idx" ON "public"."Invitations"("from_user_id");

-- CreateIndex
CREATE INDEX "Invitations_group_id_idx" ON "public"."Invitations"("group_id");

-- CreateIndex
CREATE INDEX "Invitations_expires_at_idx" ON "public"."Invitations"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."Invitations" ADD CONSTRAINT "Invitations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitations" ADD CONSTRAINT "Invitations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitations" ADD CONSTRAINT "Invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
