"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchServicesByCategory } from "@/api/services/servicesApi";
import { ServiceType } from "@/app/services/page";
import { useEffect, useState } from "react";
import ServiceCard from "@/components/ServiceCard";

type Props = {
  categoryName: string;
};

const ServicesByCategoryClient = ({ categoryName }: Props) => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const category = decodeURIComponent(categoryName);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["servicesByCategory", category],
    queryFn: () => fetchServicesByCategory(category),
    enabled: !!category,
  });

  useEffect(() => {
    if (data) {
      setServices(data);
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
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mb-6">
        <p className="font-semibold">
          Oops! Something went wrong while fetching services.
        </p>
        <p className="text-sm mt-1">
          Please try refreshing the page or check your internet connection.
        </p>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-10">Services in {category}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services?.map((service: ServiceType) => (
          <ServiceCard
            key={service.id}
            {...service}
            provider={service.provider.username}
            price={service.price}
            image={service.images?.[0]}
            title={service.title}
            serviceId={service.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ServicesByCategoryClient;
