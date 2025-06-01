import api from "@/lib/axios";

export const createBooking = async (serviceId: string, date: string) => {
  try {
    const res = await api.post("/api/bookings", { serviceId, date });
    return res.data;
  } catch (error) {
    console.log("Error creating booking:", error);
    throw error;
  }
};

export const getBookings = async () => {
  try {
    const res = await api.get("/api/bookings/client");
    return res.data;
  } catch (error) {
    console.log("Error fetching bookings:", error);
    throw error;
  }
};

export const getProviderBookings = async () => {
  try {
    const res = await api.get("/api/bookings/provider");
    return res.data;
  } catch (error) {
    console.log("Error fetching provider bookings:", error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string) => {
  try {
    const res = await api.patch(`/api/bookings/${bookingId}`, {});
    return res.data;
  } catch (error) {
    console.log("Error canceling booking:", error);
    throw error;
  }
};

export const updateBookingStatus = async (
  bookingId: string,
  status: string
) => {
  try {
    const res = await api.patch(`/api/bookings/status/${bookingId}`, {
      status,
    });
    return res.data;
  } catch (error) {
    console.log("Error updating booking:", error);
    throw error;
  }
};

export const completeBooking = async (bookingId: string) => {
  try {
    const res = await api.patch(`/api/bookings/${bookingId}/complete`, {});
    return res.data;
  } catch (error) {
    console.log("Error completing booking:", error);
    throw error;
  }
};

export const getPendingCounts = async () => {
  try {
    const res = await api.get(`/api/bookings/pending-count`);
    return res.data;
  } catch (err) {
    console.log("Error fetching pending booking count", err);
    throw err;
  }
};
