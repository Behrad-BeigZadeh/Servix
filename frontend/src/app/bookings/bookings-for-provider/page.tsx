"use client";
import { JSX, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeBooking,
  getProviderBookings,
  updateBookingStatus,
} from "@/api/bookings/bookingsApi";
import { useUserStore } from "@/stores/userStore";
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  ListChecks,
  CircleSlash,
  CalendarX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";

type BookingType = {
  id: string;
  date: string;
  status: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    provider: {
      id: string;
      username: string;
      avatar?: string;
    };
  };
  client: {
    id: string;
    username: string;
    avatar?: string;
  };
};

const statusLabels = [
  "ALL",
  "PENDING",
  "ACCEPTED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
];

const statusIcons: Record<string, JSX.Element> = {
  ALL: <ListChecks size={20} className="w-4 h-4 mr-2" />,
  PENDING: <CalendarClock size={20} className="w-4 h-4 mr-2" />,
  ACCEPTED: <CheckCircle2 size={20} className="w-4 h-4 mr-2" />,
  COMPLETED: <CheckCircle2 size={20} className="w-4 h-4 mr-2 text-green-600" />,
  CANCELLED: <XCircle size={20} className="w-4 h-4 mr-2 text-red-500" />,
  DECLINED: <CircleSlash size={20} className="w-4 h-4 mr-2 text-red-400" />,
};

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const { accessToken, user } = useUserStore();
  const router = useRouter();

  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["providerBookings"],
    queryFn: () => getProviderBookings(accessToken),
  });

  // Complete Booking Mutation
  const completeBookingMutation = useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      completeBooking(accessToken, bookingId),
    onSuccess: () => {
      toast.success("Booking status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      if (error.response?.data?.error) {
        const errors = error.response.data.error;

        if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Something went wrong");
        }
      } else {
        toast.error("Failed to update booking status");
      }
    },
  });

  // Update Booking Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      bookingId,
      newStatus,
    }: {
      bookingId: string;
      newStatus: string;
    }) => updateBookingStatus(accessToken, bookingId, newStatus),
    onSuccess: () => {
      toast.success("Booking status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      if (error.response?.data?.error) {
        const errors = error.response.data.error;

        if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Something went wrong");
        }
      } else {
        toast.error("Failed to update booking status");
      }
    },
  });

  useEffect(() => {
    if (data) {
      setBookings(data.data);
    }
  }, [data]);
  useEffect(() => {
    if (user && user.role !== "PROVIDER") {
      router.replace("/");
    }
  }, [user]);

  const filteredBookings =
    selectedStatus === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === selectedStatus);

  if (isLoading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  if (isError) {
    let errMsg = "Something went wrong.";
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof error.response === "object" &&
      error.response &&
      "data" in error.response &&
      typeof error.response.data === "object" &&
      error.response.data &&
      "error" in error.response.data &&
      typeof error.response.data.error === "string"
    ) {
      errMsg = error.response.data.error;
    }

    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mb-6 mt-10">
        <p className="font-semibold">Error: {errMsg}</p>
        <p className="text-sm mt-1">Something Went Wrong </p>
      </div>
    );
  }

  return (
    <div className="py-12 bg-zinc-50 text-zinc-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Booking Requests</h1>

        <div className="flex flex-col items-center justify-center gap-3 mb-8 sm:flex-row sm:flex-wrap">
          {statusLabels.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`w-[160px] sm:w-auto flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition border ${
                selectedStatus === status
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-blue-50"
              }`}
            >
              {statusIcons[status]}
              {status === "ALL"
                ? "All"
                : status
                    .toLowerCase()
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-zinc-800">
            <CalendarX size={80} className="mb-4 text-zinc-800" />
            <p className="text-lg">No bookings found for this filter.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] w-full">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border border-zinc-200 rounded-xl bg-white shadow-sm flex flex-col gap-2 text-left"
              >
                <div className="relative w-full aspect-video -mt-2">
                  <img
                    src={booking.service.images?.[0]}
                    alt={booking.service.title}
                    className="absolute inset-0 w-full h-full object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <h2 className="text-lg font-semibold">
                  {booking.service.title}
                </h2>
                <p className="text-sm text-zinc-600">
                  <strong>Client:</strong> {booking.client.username}
                </p>
                <p className="text-sm text-zinc-600">
                  <strong>Status:</strong>{" "}
                  {booking.status
                    .toLowerCase()
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                <p className="text-sm text-zinc-600">
                  <strong>Price:</strong> ${booking.service.price}
                </p>
                {booking.status === "ACCEPTED" && (
                  <div>
                    <button
                      disabled={completeBookingMutation.isPending}
                      onClick={() =>
                        completeBookingMutation.mutate({
                          bookingId: booking.id,
                        })
                      }
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                    >
                      {completeBookingMutation.isPending
                        ? "Submitting..."
                        : "Change status to completed"}
                    </button>
                  </div>
                )}

                {booking.status === "PENDING" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          bookingId: booking.id,
                          newStatus: "ACCEPTED",
                        })
                      }
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                    >
                      {updateStatusMutation.isPending
                        ? "Accepting..."
                        : "Accept"}
                    </button>
                    <button
                      disabled={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          bookingId: booking.id,
                          newStatus: "DECLINED",
                        })
                      }
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                    >
                      {updateStatusMutation.isPending
                        ? "Declining..."
                        : "Decline"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderBookings;
