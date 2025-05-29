"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getSingleService } from "@/api/services/servicesApi";
import { useEffect, useState } from "react";
import { ServiceType } from "../page";
import { useUserStore } from "@/stores/userStore";
import { createBooking } from "@/api/bookings/bookingsApi";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Props = {
  serviceId: string;
};

export default function ServiceDetailsClient({ serviceId }: Props) {
  const [service, setService] = useState<ServiceType | null>(null);
  const { accessToken } = useUserStore();
  const router = useRouter();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getSingleService(serviceId),
  });

  const bookingMutation = useMutation({
    mutationFn: () =>
      createBooking(accessToken!, serviceId, new Date().toISOString()),
    onSuccess: () => {
      toast.success("Booking request sent!");
      router.push("/bookings/my-bookings");
    },

    onError: (error: AxiosError<{ error: string }>) => {
      if (error.response?.data?.error) {
        const errors = error.response.data.error;

        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            toast.error(err.message || "Validation error");
          });
        } else if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Something went wrong");
        }
      } else {
        toast.error("Failed to book service");
      }
    },
  });

  useEffect(() => {
    if (data) {
      setService(data.data);
    }
  }, [data]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mt-10 mb-6">
        <p className="font-semibold mt-10">
          Oops! Something went wrong while fetching services.
        </p>
        <p className="text-sm mt-1">
          Please try refreshing the page or check your internet connection.
        </p>
      </div>
    );

  return (
    <div className="max-w-[80%] mt-10 mx-auto  space-y-10 text-zinc-900">
      {/* Hero */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-soft">
        <p className="absolute top-4 left-4 bg-red-500 text-white text-sm sm:text-base px-3 py-1 rounded-md shadow-md z-10">
          {service?.category.name}
        </p>

        <img
          src={service?.images?.[0] ?? "/placeholder.png"}
          alt={service?.title ?? "Service image"}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Title & Provider */}

      <div className="space-y-1 ">
        {" "}
        <h1 className="text-3xl font-bold">{service?.title}</h1>
        <p className="text-muted text-sm">
          Provided by{" "}
          <span className="font-semibold">{service?.provider?.username}</span>
        </p>
      </div>

      {/* Price + CTA */}
      <div className=" flex items-center justify-between rounded-xl bg-zinc-100  sm:p-4 shadow-soft">
        <span className="sm:text-2xl font-bold">${service?.price}</span>
        <button
          onClick={() => {
            if (!accessToken)
              return toast.error("You must be logged in to book");
            bookingMutation.mutate();
          }}
          disabled={bookingMutation.isPending}
          className="bg-zinc-900 text-white p-1 sm:px-6 sm:py-2 rounded-xl hover:bg-zinc-950 transition"
        >
          {bookingMutation.isPending ? "Booking..." : "Book Now"}
        </button>
      </div>
      <p className="text-md font-semibold italic mt-2">
        Once your booking is{" "}
        <span className="font-medium text-red-500">accepted</span>, you’ll be
        able to chat directly with the provider.
      </p>

      {/* Description */}
      <div className="prose prose-zinc max-w-none">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p>{service?.description}</p>
      </div>
    </div>
  );
}
