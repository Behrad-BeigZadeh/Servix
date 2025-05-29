import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import request from "supertest";
import app from "../../backend/src/app";
import { PrismaClient, Role } from "../../backend/src/generated/prisma";

import bcrypt from "bcryptjs";
import { generateRefreshToken } from "../../backend/src/utils/jwt";
import { hashToken } from "../../backend/src/utils/hash";

jest.setTimeout(20000);
const prisma = new PrismaClient();

describe("Auth Routes", () => {
  beforeAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.createMany({
      data: [
        {
          email: "sagesiah@gmail.com",
          password: await bcrypt.hash("123123", 10),
          username: "behrad7",
          role: Role.CLIENT,
        },
        {
          email: "behrad.beh83@gmail.com",
          password: await bcrypt.hash("correctpassword", 10),
          username: "beh83",
          role: Role.CLIENT,
        },
        {
          email: "sag@gmail.com",
          password: await bcrypt.hash("123123", 10),
          username: "behrad9",
          role: Role.CLIENT,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("POST /api/auth/login", () => {
    it("should return 400 for invalid schema (e.g. missing email)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "test1234" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 400 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "doesnotexist@email.com", password: "wrongpass" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "User not found");
    });

    it("should return 401 for wrong password (if user exists)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "behrad.beh83@gmail.com", password: "wrongpass" });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid credentials");
    });

    it("should return 200 and user data for valid credentials", async () => {
      const validUser = {
        email: "sagesiah@gmail.com",
        password: "123123",
      };

      const res = await request(app).post("/api/auth/login").send(validUser);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data.user).toMatchObject({
        email: validUser.email,
        username: expect.any(String),
        id: expect.any(String),
        role: expect.any(String),
      });

      const cookies = res.headers["set-cookie"];
      expect(cookies).toEqual(
        expect.arrayContaining([expect.stringMatching(/^refreshToken=/)])
      );
    });
  });

  describe("POST /api/auth/signup", () => {
    it("should return 400 for invalid schema", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ password: "1123" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 400 for existing user", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "sagesiah@gmail.com",
        password: "123123",
        username: "asghar",
        role: "CLIENT",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "User already exists");
    });

    it("should return 400 for existing username", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "sag@gmail.com",
        password: "123123",
        username: "behrad7",
        role: "CLIENT",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "Username already taken");
    });

    it("should return 400 for missing role or username", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "no-role@gmail.com",
        password: "123123",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 201 for success signup", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        email: "pablo@gmail.com",
        password: "123123",
        username: "pablo",
        role: Role.PROVIDER,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.body.data.user).toMatchObject({
        id: expect.any(String),
        avatar: expect.any(String),
        email: "pablo@gmail.com",
        username: "pablo",
        role: Role.PROVIDER,
      });

      const cookies = res.headers["set-cookie"];
      expect(cookies).toEqual(
        expect.arrayContaining([expect.stringMatching(/^refreshToken=/)])
      );
    });
    describe("POST /api/auth/logout", () => {
      it("should return 200 for successful logout and clear refreshToken in DB and cookie", async () => {
        const loginRes = await request(app).post("/api/auth/login").send({
          email: "sagesiah@gmail.com",
          password: "123123",
        });

        expect(loginRes.statusCode).toBe(200);

        const setCookie = loginRes.headers["set-cookie"];
        expect(setCookie).toBeDefined();

        const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
        const refreshTokenCookie = cookies.find((cookie) =>
          cookie.startsWith("refreshToken=")
        );
        expect(refreshTokenCookie).toBeDefined();

        const res = await request(app)
          .post("/api/auth/logout")
          .set("Cookie", refreshTokenCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty(
          "data.message",
          "User logged out successfully"
        );

        const logoutSetCookie = res.headers["set-cookie"];
        expect(logoutSetCookie).toBeDefined();

        const logoutCookies = Array.isArray(logoutSetCookie)
          ? logoutSetCookie
          : [logoutSetCookie];
        const clearedRefreshTokenCookie = logoutCookies.find((cookie) =>
          cookie.startsWith("refreshToken=")
        );
        expect(clearedRefreshTokenCookie).toBeDefined();
        expect(clearedRefreshTokenCookie).toContain("refreshToken=;");
        expect(clearedRefreshTokenCookie).toMatch(/Expires=|Max-Age=0/);

        const userInDb = await prisma.user.findUnique({
          where: { email: "sagesiah@gmail.com" },
        });
        expect(userInDb?.refreshToken).toBeNull();
      });

      it("should return 204 if no refreshToken cookie is present", async () => {
        const res = await request(app).post("/api/auth/logout");
        expect(res.statusCode).toBe(204);
        expect(res.body).toEqual({});
      });
    });

    describe("POST /api/auth/refresh-token", () => {
      it("should return 401 when no refresh token is provided", async () => {
        const res = await request(app).post("/api/auth/refresh-token").send({});

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Refresh token not found");
      });
      it("should return 401 when refresh token is invalid", async () => {
        const res = await request(app)
          .post("/api/auth/refresh-token")
          .set("Cookie", ["refreshToken=invalidtoken"]);
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid refresh token");
      });
      it("should return 401 if token is valid but user does not exist", async () => {
        const userId = "nonexistent-user-id";
        const refreshToken = generateRefreshToken(userId);

        const res = await request(app)
          .post("/api/auth/refresh-token")
          .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid refresh token");
      });
      it("should return 401 if refresh token does not match hashed one in DB", async () => {
        const response = await request(app).post("/api/auth/login").send({
          email: "pablo@gmail.com",
          password: "123123",
          username: "pablo",
          role: Role.PROVIDER,
        });
        const user = response.body.data.user;

        const wrongRefreshToken = generateRefreshToken(user.id);
        const unrelatedHashed = await hashToken("someothertoken");

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: unrelatedHashed },
        });

        const res = await request(app)
          .post("/api/auth/refresh-token")
          .set("Cookie", [`refreshToken=${wrongRefreshToken}`]);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid refresh token");
      });

      it("should return new access and refresh tokens when refresh token is valid", async () => {
        const response = await request(app).post("/api/auth/login").send({
          email: "pablo@gmail.com",
          password: "123123",
          username: "pablo",
          role: Role.PROVIDER,
        });
        const user = response.body.data.user;

        const rawRefreshToken = generateRefreshToken(user.id);
        const hashed = await hashToken(rawRefreshToken);

        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: hashed },
        });

        const res = await request(app)
          .post("/api/auth/refresh-token")
          .set("Cookie", [`refreshToken=${rawRefreshToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("accessToken");
        expect(res.body.data.user).toMatchObject({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });

        const setCookieHeader = res.headers["set-cookie"];
        expect(setCookieHeader).toBeDefined();
        expect(setCookieHeader[0]).toMatch(/refreshToken=.*HttpOnly/);
      });
    });
  });
});
