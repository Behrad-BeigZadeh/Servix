jest.mock("cloudinary", () => ({
  uploader: {
    upload_stream: jest.fn((options, callback) => {
      setImmediate(() =>
        callback(null, { secure_url: "https://fakeimage.com/image.jpg" })
      );
      return {
        end: jest.fn(),
      };
    }),
  },
}));

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import request from "supertest";
import app from "../../backend/src/app";
import { PrismaClient, Role } from "../../backend/src/generated/prisma";
import bcrypt from "bcryptjs";
jest.setTimeout(20000);

const prisma = new PrismaClient();

describe("Services routes", () => {
  let testService: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string;
    price: number;
    images: string[];
    providerId: string;
    categoryId: string;
  };

  beforeAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    const testClient = await prisma.user.create({
      data: {
        email: "client@test.com",
        password: await bcrypt.hash("123123", 10),
        username: "testclient",
        role: Role.CLIENT,
      },
    });

    const testProvider = await prisma.user.create({
      data: {
        email: "provider@test.com",
        password: await bcrypt.hash("123123", 10),
        username: "testprovider",
        role: Role.PROVIDER,
      },
    });

    const testCategory = await prisma.category.create({
      data: {
        name: "Test Category",
      },
    });

    testService = await prisma.service.create({
      data: {
        title: "Test Service",
        description: "Mocked service",
        price: 1000,
        categoryId: testCategory.id,
        providerId: testProvider.id,
      },
    });
    const secondService = await prisma.service.create({
      data: {
        title: "Test Service 2",
        description: "Mocked service",
        price: 1000,
        categoryId: testCategory.id,
        providerId: testProvider.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.service.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.category.deleteMany();

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["client@test.com", "provider@test.com"],
        },
      },
    });
    await prisma.$disconnect();
  });
  describe("GET /api/services", () => {
    it("should return 200 and return all services", async () => {
      const res = await request(app).get("/api/services").send();
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe("GET /api/services/featured", () => {
    it("should return 200 and return all featured services", async () => {
      const res = await request(app).get("/api/services/featured").send();
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe("GET /api/services/provider/:providerId", () => {
    it("should return 401 for not authenticated user", async () => {
      const res = await request(app)
        .get(`/api/services/provider/wrongId`)
        .send();
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
    it("should return 404 if service does not exist ", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;

      const res = await request(app)
        .get(`/api/services/provider/wrongId`)
        .send()
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Service not found");
    });
    it("should return 200 and return all services", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;

      const res = await request(app)
        .get(`/api/services/provider/${response.body.data.user.id}`)
        .send()
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("provider");
      expect(res.body.data[0]).toHaveProperty("category");
    });
  });
  describe("GET /api/services/:id", () => {
    it("should return 404 if service does not exist ", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;

      const res = await request(app)
        .get(`/api/services/wrongId`)

        .send()
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Service not found");
    });
    it("should return 200 and return the service", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;

      const res = await request(app)
        .get(`/api/services/${testService.id}`)
        .send()
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("provider");
      expect(res.body.data).toHaveProperty("category");
    });
  });
  describe("POST /api/services", () => {
    let providerToken: string;
    let providerCookies: string[];

    beforeAll(async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });
      providerToken = res.body.data.accessToken;
      const cookies = res.headers["set-cookie"];
      providerCookies = Array.isArray(cookies) ? cookies : [cookies];
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).post("/api/services");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 403 if user is not a provider", async () => {
      const clientLogin = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const res = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${clientLogin.body.data.accessToken}`)
        .set("Cookie", clientLogin.headers["set-cookie"])
        .send();

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "error",
        "Only providers can create services"
      );
    });

    it("should return 400 if validation fails (e.g., missing fields)", async () => {
      const res = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies)
        .field("title", "")
        .field("description", "")
        .field("price", "")
        .field("categoryId", "");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 400 if image is missing", async () => {
      const res = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies)
        .field("title", "Valid Title")
        .field("description", "This is a valid description.")
        .field("price", "100")
        .field("categoryId", testService.categoryId);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Image is required");
    });

    it("should return 400 if image type is invalid", async () => {
      const res = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies)
        .field("title", "Test")
        .field("description", "Desc")
        .field("price", "100")
        .field("categoryId", testService.categoryId)
        .attach("image", Buffer.from("dummy image content"), {
          filename: "test.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(Array.isArray(res.body.error)).toBe(true);
    });

    it("should return 400 if image is too large", async () => {
      const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB

      const res = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies)
        .field("title", "Test")
        .field("description", "Desc")
        .field("price", "100")
        .field("categoryId", testService.categoryId)
        .attach("image", largeBuffer, {
          filename: "large.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(Array.isArray(res.body.error)).toBe(true);
    });

    it("should create a service and return 200", async () => {
      const smallPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+QnCkKgAAAABJRU5ErkJggg==",
        "base64"
      );

      const res = await request(app)
        .post("/api/services")
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies)
        .field("title", "Professional Cleaning Service")
        .field(
          "description",
          "We offer deep house cleaning with eco-friendly products."
        )
        .field("price", "150")
        .field("categoryId", testService.categoryId)
        .attach("image", smallPng, {
          filename: "small.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("images");
    });
  });
  describe("PUT /api/services/:id", () => {
    let accessToken: string;
    let cookies: string[];

    beforeAll(async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });
      accessToken = res.body.data.accessToken;
      const rawCookie = res.headers["set-cookie"];
      cookies = Array.isArray(rawCookie) ? rawCookie : [rawCookie];
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app)
        .put(`/api/services/${testService.id}`)
        .send({ title: "Unauthorized update" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 403 if user is not a provider", async () => {
      const login = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const res = await request(app)
        .put(`/api/services/${testService.id}`)
        .set("Authorization", `Bearer ${login.body.data.accessToken}`)
        .set("Cookie", login.headers["set-cookie"])
        .send({ title: "Client trying to update" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "error",
        "Only providers can update services"
      );
    });

    it("should return 404 if service does not exist", async () => {
      const res = await request(app)
        .put(`/api/services/nonexistent`)
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({
          title: "Updated",
          description: "Updated description",
          price: 1234,
          categoryId: testService.categoryId,
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Service not found");
    });

    it("should return 403 if provider tries to update someone else's service", async () => {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const newProvider = await prisma.user.create({
        data: {
          email: "aprovider@test.com",
          password: await bcrypt.hash("123123", 10),
          username: `testprovider-${uniqueSuffix}`,
          role: Role.PROVIDER,
        },
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "aprovider@test.com",
        password: "123123",
      });

      const token = res.body.data.accessToken;
      const cookiesOther = res.headers["set-cookie"];

      const updateRes = await request(app)
        .put(`/api/services/${testService.id}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", cookiesOther)
        .send({
          title: "Malicious update",
          description: "You shouldn't see this",
          price: 1,
          categoryId: testService.categoryId,
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body).toHaveProperty(
        "error",
        "You can only modify your own services"
      );
    });

    it("should return 400 on invalid update body", async () => {
      const res = await request(app)
        .put(`/api/services/${testService.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({ title: "" }); // Invalid due to Zod schema

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should update service successfully and return 200", async () => {
      const smallPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P4//8/AwAI/AL+QnCkKgAAAABJRU5ErkJggg==",
        "base64"
      );

      const res = await request(app)
        .put(`/api/services/${testService.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .field("title", "Updated Service Title")
        .field("description", "Updated Description")
        .field("price", "2000")
        .field("categoryId", testService.categoryId)
        .attach("image", smallPng, {
          filename: "small.png",
          contentType: "image/png",
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("title", "Updated Service Title");
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("images");
    });
  });
  describe("DELETE /api/services/:id", () => {
    let providerToken: string;
    let clientToken: string;
    let providerCookies: string[];
    let clientCookies: string[];

    beforeAll(async () => {
      const providerLogin = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });
      providerToken = providerLogin.body.data.accessToken;
      const providerRawCookies = providerLogin.headers["set-cookie"];
      providerCookies = Array.isArray(providerRawCookies)
        ? providerRawCookies
        : [providerRawCookies];

      const clientLogin = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });
      clientToken = clientLogin.body.data.accessToken;
      const clientRawCookies = clientLogin.headers["set-cookie"];
      clientCookies = Array.isArray(clientRawCookies)
        ? clientRawCookies
        : [clientRawCookies];
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = await request(app).delete(`/api/services/${testService.id}`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 403 if user is not a provider", async () => {
      const res = await request(app)
        .delete(`/api/services/${testService.id}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .set("Cookie", clientCookies);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "error",
        "Only providers can delete services"
      );
    });

    it("should return 404 if service does not exist", async () => {
      const res = await request(app)
        .delete("/api/services/nonexistentid123")
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Service not found");
    });

    it("should return 403 if service does not belong to the provider", async () => {
      const otherProvider = await prisma.user.create({
        data: {
          email: "otherprovider@test.com",
          password: await bcrypt.hash("123123", 10),
          username: "otherprovider",
          role: Role.PROVIDER,
        },
      });

      const otherService = await prisma.service.create({
        data: {
          title: "Other Service",
          description: "Not yours",
          price: 200,
          categoryId: testService.categoryId,
          providerId: otherProvider.id,
        },
      });

      const res = await request(app)
        .delete(`/api/services/${otherService.id}`)
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "error",
        "You can only delete your own services"
      );

      await prisma.service.delete({ where: { id: otherService.id } });
      await prisma.user.delete({ where: { id: otherProvider.id } });
    });

    it("should delete the service and return 200", async () => {
      const serviceToDelete = await prisma.service.create({
        data: {
          title: "Service to Delete",
          description: "Will be deleted",
          price: 123,
          categoryId: testService.categoryId,
          providerId: (await prisma.user.findFirst({
            where: { email: "provider@test.com" },
          }))!.id,
        },
      });

      const res = await request(app)
        .delete(`/api/services/${serviceToDelete.id}`)
        .set("Authorization", `Bearer ${providerToken}`)
        .set("Cookie", providerCookies);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id", serviceToDelete.id);

      const deleted = await prisma.service.findUnique({
        where: { id: serviceToDelete.id },
      });
      expect(deleted).toBeNull();
    });
  });
});
