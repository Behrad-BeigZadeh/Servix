import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/users.route";
import serviceRoutes from "./routes/services.route";
import bookingRoutes from "./routes/bookings.route";
import chatRoutes from "./routes/chat.route";
import categoryRoutes from "./routes/category.route";
import cors from "cors";
import { app, server } from "./sockets/socket";
import { prisma } from "./lib/prisma";
dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/categories", categoryRoutes);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  prisma
    .$connect()
    .then(() => {
      console.log("Connected to database successfully");
    })
    .catch((error) => {
      console.error("Error connecting to the database", error);
    });
});
