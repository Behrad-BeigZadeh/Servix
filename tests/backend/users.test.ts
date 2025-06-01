import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import request from "supertest";
import app from "../../backend/src/app";
import { PrismaClient, Role } from "../../backend/src/generated/prisma";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

jest.setTimeout(20000);

describe("Users route", () => {
  let testUser = {} as any;

  beforeAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    testUser = await prisma.user.create({
      data: {
        username: "test",
        email: "test@test.com",
        password: await bcrypt.hash("123123", 10),
        role: Role.CLIENT,
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

  describe("GET /api/users", () => {
    it("should return 401 for unauthenticated user", async () => {
      const res = await request(app).get("/api/users/auth-user").send();
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
    it("should return 200 for authenticated user", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "123123",
      });

      const accessToken = response.body.data.accessToken;
      expect(accessToken).toBeDefined();

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const res = await request(app)
        .get("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("id", testUser.id);
      expect(res.body.data).toHaveProperty("username", testUser.username);
      expect(res.body.data).toHaveProperty("email", testUser.email);
      expect(res.body.data).toHaveProperty("role", testUser.role);
    });
  });
  describe("PUT /api/users/auth-user", () => {
    let accessToken: string;

    beforeAll(async () => {
      await prisma.user.deleteMany();
      testUser = await prisma.user.create({
        data: {
          username: "test",
          email: "test@test.com",
          password: await bcrypt.hash("123123", 10),
          role: Role.CLIENT,
        },
      });

      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "123123",
      });

      accessToken = response.body.data?.accessToken;
      expect(accessToken).toBeDefined();
    });

    it("should return 401 for unauthenticated user", async () => {
      const res = await request(app).put("/api/users/auth-user").send({
        username: "newusername",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 400 for invalid email", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
      expect(res.body.error[0].message).toBe("Invalid email address");
    });

    it("should return 400 for short password", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.error[0].message).toBe(
        "Password must be at least 6 characters"
      );
    });

    it("should return 400 for invalid avatar URL", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ avatar: "not-a-url" });

      expect(res.status).toBe(400);
      expect(res.body.error[0].message).toBe("Avatar must be a valid URL");
    });

    it("should update username", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ username: "updatedUser" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("username", "updatedUser");
    });

    it("should update email", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ email: "updated@test.com" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("email", "updated@test.com");
    });

    it("should update password", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ password: "newpassword123" });

      expect(res.status).toBe(200);

      // Login with new password to confirm change
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "updated@test.com",
        password: "newpassword123",
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
    });

    it("should update avatar", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ avatar: "https://example.com/avatar.png" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty(
        "avatar",
        "https://example.com/avatar.png"
      );
    });

    it("should return 200 and not change anything if no fields are sent", async () => {
      const res = await request(app)
        .put("/api/users/auth-user")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id", testUser.id);
    });
  });
});
