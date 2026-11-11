-- Chapter 10: messages move into a JSON column on Session (AI SDK UIMessage[]).
-- WARNING: drops the Message table, so existing chat history is deleted.

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_sessionId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "cwd",
ADD COLUMN     "messages" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "Message";

-- DropEnum
DROP TYPE "MessageStatus";

-- DropEnum
DROP TYPE "Mode";

-- DropEnum
DROP TYPE "Role";
