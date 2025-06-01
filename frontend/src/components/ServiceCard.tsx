"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteService } from "@/api/services/servicesApi";
import toast from "react-hot-toast";
import { cancelBooking } from "@/api/bookings/bookingsApi";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

type ServiceCardProps = {
  serviceId: string;
  title: string;
  provider: string;
  price: number;
  image: string;
  status?: string;
  bookingId?: string;
  showActions?: boolean;
  cancelOption?: boolean;
};

const ServiceCard = ({
  serviceId,
  title,
  provider,
  price,
  image,
  showActions = false,
  cancelOption = false,
  bookingId,
  status,
}: ServiceCardProps) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"delete" | "cancel" | null>(null);
  const router = useRouter();

  // delete a service by provider
  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => deleteService(serviceId),
    onSuccess: () => {
      toast.success("Service deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowModal(false);
      router.replace("/services/my-services");
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
        toast.error("Failed to delete service");
      }
    },
  });

  // cancel booking by client
  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["clientBookings"] });
      setShowModal(false);
    },
    onError: (error) => {
      console.error("Error cancelling booking:", error);
      toast.error("Error cancelling booking");
      setShowModal(false);
    },
  });

  const openDeleteModal = () => {
    setModalType("delete");
    setShowModal(true);
  };

  const openCancelModal = () => {
    setModalType("cancel");
    setShowModal(true);
  };

  const handleConfirm = () => {
    console.log("Confirm clicked", modalType, serviceId, bookingId);
    if (modalType === "delete") {
      deleteMutation.mutate(serviceId);
    } else if (modalType === "cancel" && bookingId) {
      cancelMutation.mutate(bookingId);
    }
  };

  return (
    <>
      {/* Card */}
      <div className="rounded-2xl shadow-soft bg-white hover:scale-105 transition p-4 mx-2 flex flex-col justify-between items-start text-zinc-900">
        <div className="relative w-full aspect-video -mt-2">
          <span
            className={`absolute top-2 right-4 text-xs font-semibold px-2 py-1 rounded-full z-10 ${
              status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : status === "ACCEPTED"
                ? "bg-green-100 text-green-800"
                : status === "CANCELLED" || status === "DECLINED"
                ? "bg-red-100 text-red-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {status}
          </span>

          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted">by {provider}</p>
        <div className="mt-3 w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">${price}</span>
            <div className="flex gap-2 justify-end">
              <Link href={`/services/${serviceId}`}>
                <button className="bg-zinc-900 text-zinc-50 px-3 py-1 rounded text-sm hover:bg-zinc-950 transition cursor-pointer">
                  View
                </button>
              </Link>
              {cancelOption && (
                <button
                  onClick={openCancelModal}
                  className="px-4 py-1 bg-red-500 text-white rounded text-sm cursor-pointer hover:bg-red-600"
                >
                  Cancel
                </button>
              )}
              {showActions && (
                <>
                  <Link href={`/services/edit/${serviceId}`}>
                    <button className="px-4 py-1 bg-blue-600 text-white rounded text-sm cursor-pointer hover:bg-blue-700">
                      Edit
                    </button>
                  </Link>
                  <button
                    onClick={openDeleteModal}
                    className="px-4 py-1 bg-red-500 text-white rounded text-sm cursor-pointer hover:bg-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-4 text-zinc-800">
              {modalType === "delete" ? "Delete Service" : "Cancel Booking"}
            </h2>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to {modalType} <strong>{title}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-zinc-300 hover:bg-zinc-400 text-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleteMutation.isPending || cancelMutation.isPending}
                className={`px-4 py-2 rounded text-white ${
                  modalType === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-600 hover:bg-red-700"
                } ${
                  deleteMutation.isPending || cancelMutation.isPending
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {modalType === "delete"
                  ? deleteMutation.isPending
                    ? "Deleting..."
                    : "Confirm"
                  : cancelMutation.isPending
                  ? "Cancelling..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceCard;
