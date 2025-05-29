"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const midddleware_1 = require("../middleware/midddleware");
const bookings_controller_1 = require("../controllers/bookings.controller");
const router = express_1.default.Router();
router.get("/client", midddleware_1.verifyToken, bookings_controller_1.getClientBookings);
router.get("/provider", midddleware_1.verifyToken, bookings_controller_1.getBookingsForProvider);
router.get("/pending-count", midddleware_1.verifyToken, bookings_controller_1.getPendingBookingsCount);
router.post("/", midddleware_1.verifyToken, bookings_controller_1.createBooking);
router.get("/:id", midddleware_1.verifyToken, bookings_controller_1.getBookingDetails);
router.patch("/status/:id", midddleware_1.verifyToken, bookings_controller_1.updateBookingStatus);
router.patch("/:id", midddleware_1.verifyToken, bookings_controller_1.cancelBooking);
router.patch("/:id/complete", midddleware_1.verifyToken, bookings_controller_1.completeBooking);
exports.default = router;
