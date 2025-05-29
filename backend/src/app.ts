// backend/app.ts
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/users.route";
import serviceRoutes from "./routes/services.route";
import bookingRoutes from "./routes/bookings.route";
import chatRoutes from "./routes/chat.route";
import categoryRoutes from "./routes/category.route";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/categories", categoryRoutes);

export default app;
