"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new prisma_1.PrismaClient();
async function main() {
    console.log("Using DB:", process.env.DATABASE_URL);
    // Clear data in correct dependency order
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    const hashedPassword = await bcryptjs_1.default.hash("password123", 10);
    // Create client user
    const client = await prisma.user.upsert({
        where: { email: "client@test.com" },
        update: {},
        create: {
            username: "clientuser",
            email: "client@test.com",
            password: hashedPassword,
            role: "CLIENT",
        },
    });
    // Create provider user
    const provider = await prisma.user.upsert({
        where: { email: "provider@test.com" },
        update: {},
        create: {
            username: "provideruser",
            email: "provider@test.com",
            password: hashedPassword,
            role: "PROVIDER",
        },
    });
    // Create category
    const category = await prisma.category.upsert({
        where: { name: "Cleaning" },
        update: {},
        create: {
            name: "Cleaning",
        },
    });
    // Create a service linked to provider and category
    const service = await prisma.service.create({
        data: {
            title: "Test Cleaning",
            description: "Test description",
            price: 100,
            images: ["https://example.com/image.jpg"],
            providerId: provider.id,
            categoryId: category.id,
        },
    });
    // Create a booking linked to client and service
    await prisma.booking.create({
        data: {
            date: new Date(),
            serviceId: service.id,
            clientId: client.id,
            status: "PENDING",
        },
    });
}
main()
    .then(async () => {
    console.log("✅ Seeding complete");
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
});
