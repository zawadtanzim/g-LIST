-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('NEEDED', 'PURCHASED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "public"."ReminderFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "public"."Users" (
    "id" SERIAL NOT NULL,
    "user_code" VARCHAR(7) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "profile_pic" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Groups" (
    "id" SERIAL NOT NULL,
    "group_code" VARCHAR(7) NOT NULL,
    "group_name" VARCHAR(50) NOT NULL,
    "group_image" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lists" (
    "id" SERIAL NOT NULL,
    "expected_total" DECIMAL(8,2) NOT NULL,
    "actual_total" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Items" (
    "id" SERIAL NOT NULL,
    "item_name" VARCHAR(50) NOT NULL,
    "item_price" DECIMAL(8,2) NOT NULL,
    "item_quantity" INTEGER NOT NULL,
    "item_status" "public"."ItemStatus" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "list_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLists" (
    "user_id" INTEGER NOT NULL,
    "list_id" INTEGER NOT NULL,
    "interval_time" TIME NOT NULL,
    "interval_freq" "public"."ReminderFrequency" NOT NULL,

    CONSTRAINT "UserLists_pkey" PRIMARY KEY ("user_id","list_id")
);

-- CreateTable
CREATE TABLE "public"."GroupLists" (
    "group_id" INTEGER NOT NULL,
    "list_id" INTEGER NOT NULL,
    "interval_time" TIME NOT NULL,
    "interval_freq" "public"."ReminderFrequency" NOT NULL,

    CONSTRAINT "GroupLists_pkey" PRIMARY KEY ("group_id","list_id")
);

-- CreateTable
CREATE TABLE "public"."GroupMembers" (
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembers_pkey" PRIMARY KEY ("user_id","group_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_user_code_key" ON "public"."Users"("user_code");

-- CreateIndex
CREATE UNIQUE INDEX "Groups_group_code_key" ON "public"."Groups"("group_code");

-- CreateIndex
CREATE INDEX "Items_list_id_idx" ON "public"."Items"("list_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserLists_user_id_key" ON "public"."UserLists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserLists_list_id_key" ON "public"."UserLists"("list_id");

-- CreateIndex
CREATE INDEX "UserLists_user_id_idx" ON "public"."UserLists"("user_id");

-- CreateIndex
CREATE INDEX "UserLists_list_id_idx" ON "public"."UserLists"("list_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupLists_group_id_key" ON "public"."GroupLists"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupLists_list_id_key" ON "public"."GroupLists"("list_id");

-- CreateIndex
CREATE INDEX "GroupLists_group_id_idx" ON "public"."GroupLists"("group_id");

-- CreateIndex
CREATE INDEX "GroupLists_list_id_idx" ON "public"."GroupLists"("list_id");

-- CreateIndex
CREATE INDEX "GroupMembers_user_id_idx" ON "public"."GroupMembers"("user_id");

-- CreateIndex
CREATE INDEX "GroupMembers_group_id_idx" ON "public"."GroupMembers"("group_id");

-- AddForeignKey
ALTER TABLE "public"."Items" ADD CONSTRAINT "Items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."Lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Items" ADD CONSTRAINT "Items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLists" ADD CONSTRAINT "UserLists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLists" ADD CONSTRAINT "UserLists_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."Lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupLists" ADD CONSTRAINT "GroupLists_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupLists" ADD CONSTRAINT "GroupLists_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."Lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMembers" ADD CONSTRAINT "GroupMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMembers" ADD CONSTRAINT "GroupMembers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
