import axios from "axios";

export const createBooking = async (
  accessToken: string,
  serviceId: string,
  date: string
) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings`,
      {
        serviceId,
        date,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error creating booking:", error);
    throw error;
  }
};

export const getBookings = async (accessToken: string | null) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/client`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error fetching bookings:", error);
    throw error;
  }
};

export const getProviderBookings = async (accessToken: string | null) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/provider`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error fetching bookings:", error);
    throw error;
  }
};

export const cancelBooking = async (
  accessToken: string | null,
  bookingId: string
) => {
  try {
    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error canceling booking:", error);
    throw error;
  }
};

export const updateBookingStatus = async (
  accessToken: string | null,
  bookingId: string,
  status: string
) => {
  try {
    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/status/${bookingId}`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error updating booking:", error);
    throw error;
  }
};

export const completeBooking = async (
  accessToken: string | null,
  bookingId: string
) => {
  try {
    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error canceling booking:", error);
    throw error;
  }
};
