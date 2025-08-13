-- AlterTable
ALTER TABLE "public"."Invitations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL  '7 days';
