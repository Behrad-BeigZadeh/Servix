"use client";

import React from "react";
import ServiceCard from "./ServiceCard";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedServices } from "@/api/services/servicesApi";
import { ServiceType } from "@/app/services/page";

const FeaturedServices = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["featured-services"],
    queryFn: getFeaturedServices,
  });

  return (
    <section className="py-12 text-zinc-900 flex flex-col items-center">
      <div className="container">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold px-2">
            Featured Services
          </h2>
          <Link
            href="/services"
            className="text-sm sm:text-xl font-semibold flex italic underline text-blue-700 hover:text-blue-800 transition"
          >
            See all services →
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-red-600">
            Error loading featured services. Please try again later.
          </div>
        )}

        {!isLoading && !isError && data?.data?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.data.map((service: ServiceType) => (
              <ServiceCard
                key={service.id}
                {...service}
                serviceId={service.id}
                provider={service.provider.username}
                price={service.price}
                image={service.images?.[0]}
                title={service.title}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedServices;
