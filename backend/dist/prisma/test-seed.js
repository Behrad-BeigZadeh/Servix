"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function main() {
    console.log("Using DB:", process.env.DATABASE_URL);
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    const client = await prisma.user.create({
        data: {
            username: "clientuser",
            email: "client@test.com",
            password: "hashedpassword",
            role: "CLIENT",
        },
    });
    const provider = await prisma.user.create({
        data: {
            username: "provideruser",
            email: "provider@test.com",
            password: "hashedpassword",
            role: "PROVIDER",
        },
    });
    const category = await prisma.category.create({
        data: {
            name: "Cleaning",
        },
    });
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
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => {
    prisma.$disconnect();
});
