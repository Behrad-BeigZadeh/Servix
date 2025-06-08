import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning existing data...");
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
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685837/ser-img6_fkbxwj.jpg",
    },
    {
      title: "Math Tutoring for High School",
      category: "Tutoring",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685855/teachers-on-call-math-tutoring-1-2_ssfdea.jpg",
    },
    {
      title: "Same-day Package Delivery",
      category: "Delivery",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685877/Postal-Delivery-Package_vi2eq9.jpg",
    },
    {
      title: "Emergency Plumbing Services",
      category: "Plumbing",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685891/plumbing_20services_f8in8a.jpg",
    },
    {
      title: "Certified Electrician Help",
      category: "Electrician",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685898/16220498_lel-1445280588-600x360_ajhein.jpg",
    },
    {
      title: "Local Moving Service",
      category: "Moving",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685917/movers-in-virginia-aspect-ratio-1000-688-aspect-ratio-1000-688-6_mr4prh.png",
    },
    {
      title: "Spa & Massage Therapy",
      category: "Beauty & Wellness",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685938/massageTherapy-636218646-770x553-1_athhz0.jpg",
    },
    {
      title: "Dog Walking and Sitting",
      category: "Pet Care",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685950/4-Benefits-of-Walking-Your-Dog_mopxdx.jpg",
    },
    {
      title: "Furniture Repair",
      category: "Home Repair",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685956/VicPhillips_Goodlife_Upholstery_Restoration_AdvCarpentry_Southwark_London__ob7ava.webp",
    },
    {
      title: "PC & Laptop Fix",
      category: "Tech Support",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685980/Repair_or_replace_laptop_jqf6o0.webp",
    },
    {
      title: "Lawn Mowing and Gardening",
      category: "Gardening",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748685995/womanGardening-93909596_jpg_jojvui.jpg",
    },
    {
      title: "Custom Woodwork",
      category: "Carpentry",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748686007/Scrap-wood-console-table-Alex-Schlepphorst-Silent-Rivers_jikmxn.jpg",
    },
    {
      title: "Personal Fitness Coaching",
      category: "Fitness Training",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748686022/Personal-Trainer-Strength-Conditioning-and-Fitness-Coach-JM-Nutrition_slyccg.jpg",
    },
    {
      title: "Birthday Party Planning",
      category: "Event Planning",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748686037/how-to-plan-a-birthday-party_qn1oku.jpg",
    },
    {
      title: "Professional Portrait Photography",
      category: "Photography",
      image:
        "https://res.cloudinary.com/dc0quhvpm/image/upload/v1748686044/Thomas_Alston-2144-PRINT_oo4wil.jpg",
    },
  ];

  console.log("📂 Upserting categories...");
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
    { name: "Zack", email: "zack@example.com" },
  ];

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("👤 Upserting providers...");
  const providers = await Promise.all(
    providerData.map((p) =>
      prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: {
          username: p.name,
          email: p.email,
          role: "PROVIDER",
          password: hashedPassword,
        },
      })
    )
  );

  console.log("📋 Creating services...");
  for (const provider of providers) {
    for (const { title, category, image } of serviceData) {
      const cat = allCategories.find((c) => c.name === category);
      if (!cat) continue;

      await prisma.service.create({
        data: {
          title,
          description:
            descriptions[Math.floor(Math.random() * descriptions.length)],
          price: parseFloat((Math.random() * 150 + 50).toFixed(2)),
          images: [image],
          providerId: provider.id,
          categoryId: cat.id,
        },
      });
    }
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected.");
  });
