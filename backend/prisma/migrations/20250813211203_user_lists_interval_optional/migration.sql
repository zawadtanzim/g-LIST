-- AlterTable
ALTER TABLE "public"."GroupLists" ALTER COLUMN "interval_time" SET DEFAULT '18:00:00'::time;

-- AlterTable
ALTER TABLE "public"."Invitations" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL  '7 days';

-- AlterTable
ALTER TABLE "public"."UserLists" ALTER COLUMN "interval_time" DROP NOT NULL,
ALTER COLUMN "interval_time" SET DEFAULT '18:00:00'::time,
ALTER COLUMN "interval_freq" DROP NOT NULL;
