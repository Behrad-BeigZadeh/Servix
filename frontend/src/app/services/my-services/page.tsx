"use client";
import { getProviderServices } from "@/api/services/servicesApi";
import ServiceCard from "@/components/ServiceCard";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ServiceType } from "../page";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProviderServices = () => {
  const { user, accessToken } = useUserStore();
  const router = useRouter();
  const {
    data: services = [],
    isError,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["services"],
    queryFn: () => getProviderServices(user?.id, accessToken),
    enabled: !!user?.id && !!accessToken,
    select: (res) => res.data,
  });

  useEffect(() => {
    if (user && user.role !== "PROVIDER") {
      router.replace("/");
    }
  }, [user]);

  if (isLoading)
    return (
      <div
        data-testid="loading-spinner"
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
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mb-6 mt-10">
        <p className="font-semibold">Error: {errMsg}</p>
        <p className="text-sm mt-1">Something Went Wrong </p>
      </div>
    );
  }

  return (
    <div className="py-12 bg-zinc-50 text-zinc-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Your Services</h1>

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-zinc-800">
            <FolderOpen size={80} className="mb-4 text-zinc-800" />
            <p className="text-lg">
              You have no services yet...
              <br />
              Start adding your first service.
            </p>
            <Link
              href="/create-service"
              className="text-sm sm:text-xl font-semibold flex italic underline text-blue-700 hover:text-blue-800 transition mt-10"
            >
              Add a service →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] w-full">
            {services.map((service: ServiceType) => (
              <ServiceCard
                key={service.id}
                {...service}
                serviceId={service.id}
                provider={service.provider.username}
                price={service.price}
                image={service.images?.[0]}
                title={service.title}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderServices;
