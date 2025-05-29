import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import request from "supertest";
import app from "../../backend/src/app";
import { PrismaClient, Role } from "../../backend/src/generated/prisma";
import bcrypt from "bcryptjs";

jest.setTimeout(30000);
const prisma = new PrismaClient();

describe("Bookings routes", () => {
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

    const service = await prisma.service.create({
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

    await prisma.booking.create({
      data: {
        clientId: testClient.id,
        serviceId: service.id,
        date: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: "PENDING",
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
  describe("GET /api/bookings", () => {
    it("should return 401 for no user in request", async () => {
      const res = await request(app).get("/api/bookings/client");
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
    it("should return 200 for success and return user's bookings", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const res = await request(app)
        .get("/api/bookings/client")
        .set("Authorization", `Bearer ${accessToken}`)

        .set("Cookie", cookies);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("client");
      expect(res.body.data[0].service).toHaveProperty("provider");
    });
  });
  describe("GET /api/bookings/provider", () => {
    it("should return 401 for no user in request", async () => {
      const res = await request(app).get("/api/bookings/provider");
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
    it("should return 403 for not provider", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const res = await request(app)
        .get("/api/bookings/provider")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });
    it("should return 200 for success and return user's bookings", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const res = await request(app)
        .get("/api/bookings/provider")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("client");
      expect(res.body.data[0].service).toHaveProperty("provider");
    });
  });
  describe("POST /api/bookings/pending-count", () => {
    it("should return 401 for no user in request", async () => {
      const res = await request(app).get("/api/bookings/pending-count");
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
    it("should return 403 for not provider", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const res = await request(app)
        .get("/api/bookings/pending-count")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });
    it("should return 200 for success and return user's bookings", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const res = await request(app)
        .get("/api/bookings/pending-count")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("count");
      expect(res.body.count).toBeGreaterThan(0);
    });
  });
  describe("POST /api/bookings", () => {
    it("should return 401 for no user in request", async () => {
      const res = await request(app).post("/api/bookings");
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 400 for invalid input", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({}); // Missing fields

      expect(res.statusCode).toBe(400);
    });
    it("should return 400 when a provider tries to book their own service", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;

      const service = await prisma.service.findFirst({
        where: {
          providerId: response.body.data.user.id,
        },
      });

      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({
          serviceId: service?.id,
          date: new Date().toISOString(),
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty(
        "error",
        "You cannot book your own service"
      );
    });
    it("should return 400 for existing booking", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      const accessToken = response.body.data.accessToken;

      const service = await prisma.service.findFirst({
        where: { title: "Test Service" },
      });

      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({
          serviceId: service?.id,
          date: new Date().toISOString(),
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe(
        "You already have an active booking for this service"
      );
    });

    it("should return 404 for non existing service", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;

      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({
          serviceId: "0",
          date: new Date().toISOString(),
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Service not found");
    });
    it("should return 201 if booking is successful", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const accessToken = response.body.data.accessToken;
      const service = await prisma.service.findFirst({
        where: {
          title: "Test Service 2",
        },
      });

      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", cookies)
        .send({
          serviceId: service?.id,
          date: new Date(Date.now() + 3600_000).toISOString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("service");
      expect(res.body.data.status).toBe("PENDING");
    });
  });
  describe("PATCH /api/bookings/status/:id", () => {
    let providerAccessToken: string;
    let clientBookingId: string | undefined;
    let client;
    let providerCookies: string[];
    let clientBooking;

    beforeAll(async () => {
      client = await prisma.user.findUnique({
        where: {
          email: "client@test.com",
        },
      });
      clientBooking = await prisma.booking.findFirst({
        where: {
          clientId: client?.id,
        },
      });
      clientBookingId = clientBooking?.id;
      const providerLogin = await request(app).post("/api/auth/login").send({
        email: "provider@test.com",
        password: "123123",
      });
      providerAccessToken = providerLogin.body.data.accessToken;
      const cookies = providerLogin.headers["set-cookie"];
      providerCookies = Array.isArray(cookies) ? cookies : [cookies];
    });

    it("should return 401 if no user is authenticated", async () => {
      const res = await request(app).patch(
        `/api/bookings/status/${clientBookingId}`
      );
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 403 if the user is not a provider", async () => {
      const clientLogin = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      const res = await request(app)
        .patch(`/api/bookings/status/${clientBookingId}`)
        .set("Authorization", `Bearer ${clientLogin.body.data.accessToken}`)
        .set("Cookie", clientLogin.headers["set-cookie"])
        .send({ status: "ACCEPTED" });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });

    it("should return 404 if booking does not exist", async () => {
      const res = await request(app)
        .patch(`/api/bookings/status/${"wrongId"}`)
        .set("Authorization", `Bearer ${providerAccessToken}`)
        .set("Cookie", providerCookies)
        .send({ status: "ACCEPTED" });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error", "Booking not found");
    });

    it("should return 400 for invalid status value", async () => {
      const res = await request(app)
        .patch(`/api/bookings/status/${clientBookingId}`)
        .set("Authorization", `Bearer ${providerAccessToken}`)
        .set("Cookie", providerCookies)
        .send({ status: "INVALID_STATUS" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should update booking status successfully", async () => {
      const res = await request(app)
        .patch(`/api/bookings/status/${clientBookingId}`)
        .set("Authorization", `Bearer ${providerAccessToken}`)
        .set("Cookie", providerCookies)
        .send({ status: "ACCEPTED" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("id", clientBookingId);
      expect(res.body.data.status).toBe("ACCEPTED");
    });
  });
  describe("PATCH /api/bookings/:id - cancel booking", () => {
    let clientAccessToken: string;
    let clientCookies: string[];
    let bookingId: string;
    let completedBookingId: string;

    beforeAll(async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "client@test.com",
        password: "123123",
      });

      clientAccessToken = loginRes.body.data.accessToken;
      const cookies = loginRes.headers["set-cookie"];
      clientCookies = Array.isArray(cookies) ? cookies : [cookies];

      const service = await prisma.service.findFirst({
        where: { title: "Test Service" },
      });

      const newBooking = await prisma.booking.create({
        data: {
          clientId: loginRes.body.data.user.id,
          serviceId: service!.id,
          date: new Date(Date.now() + 3600_000),
          status: "ACCEPTED",
        },
      });

      bookingId = newBooking.id;

      const completedBooking = await prisma.booking.create({
        data: {
          clientId: loginRes.body.data.user.id,
          serviceId: service!.id,
          date: new Date(Date.now() + 3600_000),
          status: "COMPLETED",
        },
      });

      completedBookingId = completedBooking.id;
    });

    it("should return 401 if no token is provided", async () => {
      const res = await request(app).patch(`/api/bookings/${bookingId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("should return 404 if booking is not found or not owned by user", async () => {
      const res = await request(app)
        .patch(`/api/bookings/nonexistent-id`)
        .set("Authorization", `Bearer ${clientAccessToken}`)
        .set("Cookie", clientCookies);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error", "Booking not found");
    });

    it("should cancel the booking if it's not already completed, declined, or cancelled", async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .set("Authorization", `Bearer ${clientAccessToken}`)
        .set("Cookie", clientCookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("id", bookingId);
      expect(res.body.data).toHaveProperty("status", "CANCELLED");

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      expect(booking?.status).toBe("CANCELLED");
    });

    it("should NOT cancel the booking if it is already completed", async () => {
      const res = await request(app)
        .patch(`/api/bookings/${completedBookingId}`)
        .set("Authorization", `Bearer ${clientAccessToken}`)
        .set("Cookie", clientCookies);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "Booking cannot be canceled");
      const booking = await prisma.booking.findUnique({
        where: { id: completedBookingId },
      });
      expect(booking?.status).toBe("COMPLETED");
    });
  });
});
