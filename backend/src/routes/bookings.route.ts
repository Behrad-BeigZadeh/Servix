import express from "express";
import { verifyToken } from "../middleware/midddleware";
import {
  createBooking,
  getClientBookings,
  getBookingsForProvider,
  getBookingDetails,
  updateBookingStatus,
  cancelBooking,
  getPendingBookingsCount,
  completeBooking,
} from "../controllers/bookings.controller";

const router = express.Router();
router.get("/client", verifyToken, getClientBookings);
router.get("/provider", verifyToken, getBookingsForProvider);
router.get("/pending-count", verifyToken, getPendingBookingsCount);
router.post("/", verifyToken, createBooking);
router.get("/:id", verifyToken, getBookingDetails);
router.patch("/status/:id", verifyToken, updateBookingStatus);
router.patch("/:id", verifyToken, cancelBooking);
router.patch("/:id/complete", verifyToken, completeBooking);

export default router;
