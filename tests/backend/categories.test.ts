import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import request from "supertest";
import app from "../../backend/src/app";
import { PrismaClient, Role } from "../../backend/src/generated/prisma";
import bcrypt from "bcryptjs";

jest.setTimeout(20000);

const prisma = new PrismaClient();

describe("Category routes", () => {
  let testCategory1: any;
  let testCategory2: any;
  let testProvider: any;

  beforeAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Create provider
    testProvider = await prisma.user.create({
      data: {
        username: "provider1",
        email: "provider1@test.com",
        password: await bcrypt.hash("password123", 10),
        role: Role.PROVIDER,
      },
    });

    // Create categories
    testCategory1 = await prisma.category.create({
      data: { name: "Plumbing" },
    });

    testCategory2 = await prisma.category.create({
      data: { name: "Electrician" },
    });

    // Create services under categories
    await prisma.service.create({
      data: {
        title: "Fix leaky pipe",
        description: "Fixing any leaking pipe in your house",
        price: 120,
        providerId: testProvider.id,
        categoryId: testCategory1.id,
      },
    });

    await prisma.service.create({
      data: {
        title: "Install light switch",
        description: "New switch installation",
        price: 80,
        providerId: testProvider.id,
        categoryId: testCategory2.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/categories", () => {
    it("should return all categories sorted by name", async () => {
      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].name < res.body[1].name).toBe(true); // alphabetical order
    });
  });

  describe("GET /api/categories/services", () => {
    it("should return services for a valid category", async () => {
      const res = await request(app).get(
        `/api/categories/services?category=${encodeURIComponent("Plumbing")}`
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("title", "Fix leaky pipe");
      expect(res.body[0]).toHaveProperty("provider");
      expect(res.body[0].provider).toHaveProperty(
        "username",
        testProvider.username
      );
      expect(res.body[0]).toHaveProperty("category");
      expect(res.body[0].category).toHaveProperty("name", "Plumbing");
    });

    it("should return an empty array for a valid category with no services", async () => {
      const newCategory = await prisma.category.create({
        data: { name: "Carpentry" },
      });

      const res = await request(app).get(
        `/api/categories/services?category=${encodeURIComponent("Carpentry")}`
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("should return 400 if category query is missing", async () => {
      const res = await request(app).get("/api/categories/services");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Valid category is required.");
    });

    it("should return 400 if category query is an array", async () => {
      const res = await request(app)
        .get("/api/categories/services")
        .query({ category: ["one", "two"] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Valid category is required.");
    });
  });
});
