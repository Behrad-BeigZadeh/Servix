import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/midddleware";

import {
  bookingSchema,
  updateBookingStatusSchema,
} from "../schemas/bookingSchema";
import { prisma } from "../lib/prisma";
import { getUserSocketId, io, userSocketMap } from "../sockets/socket";

export const getClientBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const bookings = await prisma.booking.findMany({
      where: {
        clientId: user.id,
      },
      include: {
        service: {
          include: {
            provider: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        client: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return res.status(200).json({ data: bookings });
  } catch (error) {
    console.error("Error getting client bookings controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getBookingsForProvider = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.role !== "PROVIDER") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        service: {
          providerId: user.id,
        },
      },
      orderBy: {
        date: "desc", // optional but recommended
      },
      include: {
        service: {
          include: {
            provider: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        client: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    return res.status(200).json({ data: bookings });
  } catch (error) {
    console.error("Error getting provider bookings controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getBookingDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        OR: [{ clientId: user.id }, { service: { providerId: user.id } }],
      },
      include: {
        service: {
          include: {
            provider: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        client: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json({ data: booking });
  } catch (error) {
    console.error("Error getting booking details controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getPendingBookingsCount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;
    if (!user || user.role !== "PROVIDER") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const count = await prisma.booking.count({
      where: {
        service: {
          providerId: user.id,
        },
        status: "PENDING",
      },
    });

    return res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching pending bookings count:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }
    const { serviceId, date } = parsed.data;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    if (service?.providerId === user.id) {
      return res
        .status(400)
        .json({ error: "You cannot book your own service" });
    }
    const existingBooking = await prisma.booking.findFirst({
      where: {
        clientId: user.id,
        serviceId,
        status: {
          in: ["PENDING", "ACCEPTED"],
        },
      },
    });

    if (existingBooking) {
      return res
        .status(400)
        .json({ error: "You already have an active booking for this service" });
    }

    const booking = await prisma.booking.create({
      data: {
        date: new Date(date),
        clientId: user.id,
        serviceId,
        status: "PENDING",
      },
      include: {
        service: {
          include: {
            provider: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    const message = "You have a new booking request";

    const notification = await prisma.notification.create({
      data: {
        userId: booking.service.providerId,
        message,
        type: "BOOKING_REQUEST",
      },
    });
    const providerSocketId = getUserSocketId(booking.service.providerId);

    if (providerSocketId) {
      io.to(providerSocketId).emit("new_notification", {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    }

    return res.status(201).json({ data: booking });
  } catch (error) {
    console.error("Error creating booking controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const updateBookingStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;
    const parsed = updateBookingStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { status } = parsed.data;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.role !== "PROVIDER") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const booking = await prisma.booking.findFirst({
      where: { id, service: { providerId: user.id } },
      include: { service: true },
    });

    if (!booking || booking.service.providerId !== user.id) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const message =
      status === "ACCEPTED"
        ? `Your booking for ${booking.service.title} was accepted.`
        : `Your booking for ${booking.service.title} was rejected.`;

    const notification = await prisma.notification.create({
      data: {
        userId: booking.clientId,
        message,
        type: status,
      },
    });

    getUserSocketId(booking.clientId);

    io.to(booking.clientId).emit("new_notification", {
      id: notification.id,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
    });

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({ data: updatedBooking });
  } catch (error) {
    console.error("Error updating booking status controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const completeBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || user.role !== "PROVIDER") {
      return res
        .status(403)
        .json({ error: "Only providers can complete bookings" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.service.providerId !== user.id) {
      return res
        .status(403)
        .json({ error: "You are not authorized to complete this booking" });
    }

    if (booking.status !== "ACCEPTED") {
      return res.status(400).json({
        error: "Only accepted bookings can be marked as completed",
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    return res.status(200).json({ data: updatedBooking });
  } catch (error) {
    console.error("Error in completeBooking controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        clientId: user.id,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (
      booking.status !== "COMPLETED" &&
      booking.status !== "CANCELLED" &&
      booking.status !== "DECLINED"
    ) {
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });

      return res.status(200).json({ data: updatedBooking });
    } else {
      return res.status(400).json({ error: "Booking cannot be canceled" });
    }
  } catch (error) {
    console.error("Error canceling booking controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
