"use client";
import ServiceCard from "@/components/ServiceCard";
import { useUserStore } from "@/stores/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { JSX, useEffect, useState } from "react";
import { getBookings } from "@/api/bookings/bookingsApi";

import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  ListChecks,
  CircleSlash,
  CalendarX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { startOrGetChatRoom } from "@/api/chat/chatApi";
import toast from "react-hot-toast";
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

const MyBookings = () => {
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const { accessToken } = useUserStore();
  const router = useRouter();
  const { data, isError, isLoading, error } = useQuery({
    queryKey: ["clientBookings"],
    queryFn: () => getBookings(),
  });

  const chatRoomMutation = useMutation({
    mutationFn: (providerId: string) => startOrGetChatRoom(providerId),
    onSuccess: (data) => {
      const roomId = data.chatRoom.id;
      toast.success("Chat started!");
      router.push(`/chat/${roomId}`);
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
        toast.error("Failed to start chat");
      }
    },
  });

  const handleStartChat = (providerId: string) => {
    if (!accessToken) {
      toast.error("You must be logged in to start a chat");
      return;
    }
    chatRoomMutation.mutate(providerId);
  };

  useEffect(() => {
    if (data) {
      setBookings(data.data);
    }
  }, [data]);

  const filteredBookings =
    selectedStatus === "ALL"
      ? bookings
      : bookings.filter((booking) => booking.status === selectedStatus);

  if (isLoading)
    return (
      <div
        data-testid="spinner"
        className="flex justify-center items-center py-20"
      >
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
      <div
        data-testid="error-message"
        className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mb-6 mt-10"
      >
        <p className="font-semibold">Error: {errMsg}</p>
        <p className="text-sm mt-1">Something Went Wrong </p>
      </div>
    );
  }

  return (
    <div className="py-12 bg-zinc-50 text-zinc-900 min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Bookings</h1>

        {/* Filter Buttons */}
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

        {/* Bookings Grid */}
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-zinc-800">
            <CalendarX size={80} className="mb-4 text-zinc-800" />
            <p className="text-lg">No bookings found for this filter.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] w-full">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="space-y-2">
                <ServiceCard
                  {...booking.service}
                  serviceId={booking.service.id}
                  provider={booking.service.provider.username}
                  price={booking.service.price}
                  image={booking.service.images?.[0]}
                  title={booking.service.title}
                  status={booking.status}
                  cancelOption={booking.status === "PENDING"}
                  bookingId={booking.id}
                />

                {booking.status === "ACCEPTED" && (
                  <button
                    onClick={() => handleStartChat(booking.service.provider.id)}
                    disabled={chatRoomMutation.isPending}
                    className=" w-[95%] bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
                  >
                    {chatRoomMutation.isPending
                      ? "Starting Chat..."
                      : `Start Chat with ${booking.service.provider.username}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
