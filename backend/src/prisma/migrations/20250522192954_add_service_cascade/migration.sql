-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_providerId_fkey";

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
