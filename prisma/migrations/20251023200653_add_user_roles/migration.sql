-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'EMPLOYEE', 'ADMIN');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
