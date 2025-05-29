"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../generated/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new prisma_1.PrismaClient();
async function main() {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    const categories = [
        "Cleaning",
        "Tutoring",
        "Delivery",
        "Plumbing",
        "Electrician",
        "Moving",
        "Beauty & Wellness",
        "Pet Care",
        "Home Repair",
        "Tech Support",
        "Gardening",
        "Carpentry",
        "Fitness Training",
        "Event Planning",
        "Photography",
    ];
    const titles = [
        "Deep Home Cleaning",
        "Math Tutoring for High School",
        "Same-day Package Delivery",
        "Emergency Plumbing Services",
        "Certified Electrician Help",
        "Local Moving Service",
        "Spa & Massage Therapy",
        "Dog Walking and Sitting",
        "Furniture Repair",
        "PC & Laptop Fix",
        "Lawn Mowing and Gardening",
        "Custom Woodwork",
        "Personal Fitness Coaching",
        "Birthday Party Planning",
        "Professional Portrait Photography",
    ];
    const descriptions = [
        "High-quality and thorough service for your needs.",
        "Certified and experienced provider ready to help.",
        "Quick and reliable service at your convenience.",
        "Affordable, fast, and trustworthy solutions.",
        "Your satisfaction is our top priority.",
    ];
    const serviceData = [
        {
            title: "Deep Home Cleaning",
            category: "Cleaning",
            image: "https://www.shineglow.in/images/services/ser-img6.jpg",
        },
        {
            title: "Math Tutoring for High School",
            category: "Tutoring",
            image: "https://www.teachersoncall.ca/files/teachers-on-call-math-tutoring-1-2.jpg",
        },
        {
            title: "Same-day Package Delivery",
            category: "Delivery",
            image: "https://www.pymnts.com/wp-content/uploads/2022/04/Postal-Delivery-Package.jpg",
        },
        {
            title: "Emergency Plumbing Services",
            category: "Plumbing",
            image: "https://www.powerhouseswfl.com/images/blog/plumbing%20services.jpeg",
        },
        {
            title: "Certified Electrician Help",
            category: "Electrician",
            image: "https://static.cms.yp.ca/ecms/media/1/16220498_lel-1445280588-600x360.jpg",
        },
        {
            title: "Local Moving Service",
            category: "Moving",
            image: "https://www.jkmoving.com/app/uploads/2024/09/movers-in-virginia-aspect-ratio-1000-688-aspect-ratio-1000-688-6.png",
        },
        {
            title: "Spa & Massage Therapy",
            category: "Beauty & Wellness",
            image: "https://www.nextlevelurgentcare.com/wp-content/uploads/2022/06/massageTherapy-636218646-770x553-1.jpg",
        },
        {
            title: "Dog Walking and Sitting",
            category: "Pet Care",
            image: "https://bluecrossvethospital.com/wp-content/uploads/2018/01/4-Benefits-of-Walking-Your-Dog.jpg",
        },
        {
            title: "Furniture Repair",
            category: "Home Repair",
            image: "https://admin.craftscouncil.org.uk/images/tdkvQ3Ykoo-h_OLJ0bzZhpJsn5Y=/36605/format-webp%7Cwidth-990/VicPhillips_Goodlife_Upholstery_Restoration_AdvCarpentry_Southwark_London_.jpg",
        },
        {
            title: "PC & Laptop Fix",
            category: "Tech Support",
            image: "https://images.ctfassets.net/16nm6vz43ids/7g9t8d7WaVz7BM1L9RmrCl/9f42265945660d42d58111bf3e169aab/Repair_or_replace_laptop.png?fm=webp&q=65",
        },
        {
            title: "Lawn Mowing and Gardening",
            category: "Gardening",
            image: "https://assets.clevelandclinic.org/transform/e5eab4e9-d43a-4c81-a596-c218b74ceadf/womanGardening-93909596_jpg",
        },
        {
            title: "Custom Woodwork",
            category: "Carpentry",
            image: "https://silentrivers.com/wp-content/uploads/2017/05/Scrap-wood-console-table-Alex-Schlepphorst-Silent-Rivers.jpg",
        },
        {
            title: "Personal Fitness Coaching",
            category: "Fitness Training",
            image: "https://www.julienutrition.com/wp-content/uploads/2024/11/Personal-Trainer-Strength-Conditioning-and-Fitness-Coach-JM-Nutrition.jpg",
        },
        {
            title: "Birthday Party Planning",
            category: "Event Planning",
            image: "https://www.letsroam.com/explorer/wp-content/uploads/sites/10/2022/03/how-to-plan-a-birthday-party.jpg",
        },
        {
            title: "Professional Portrait Photography",
            category: "Photography",
            image: "https://images.squarespace-cdn.com/content/v1/572e050c4d088ea3a8f0ac9d/1652567773148-V0S2AG6YR65EVB0T522U/Thomas_Alston-2144-PRINT.jpg?format=1000w",
        },
    ];
    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    const allCategories = await prisma.category.findMany();
    const providerData = [
        { name: "David", email: "david@example.com" },
        { name: "Sarah", email: "sarah@example.com" },
        { name: "Zack", email: "Zack@example.com" },
    ];
    const hashedPassword = await bcryptjs_1.default.hash("password123", 10);
    const providers = await Promise.all(providerData.map((p) => prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: {
            username: p.name,
            email: p.email,
            role: "PROVIDER",
            password: hashedPassword,
        },
    })));
    for (const provider of providers) {
        for (const { title, category, image } of serviceData) {
            const cat = allCategories.find((c) => c.name === category);
            if (!cat)
                continue;
            await prisma.service.create({
                data: {
                    title,
                    description: descriptions[Math.floor(Math.random() * descriptions.length)],
                    price: parseFloat((Math.random() * 150 + 50).toFixed(2)),
                    images: [image], // Use only one relevant image
                    providerId: provider.id,
                    categoryId: cat.id,
                },
            });
        }
    }
}
main()
    .then(() => console.log("✅ Seeding complete"))
    .catch((e) => console.error("❌ Error during seeding:", e))
    .finally(() => prisma.$disconnect());
