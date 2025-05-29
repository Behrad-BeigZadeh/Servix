"use client";
import React, { useEffect, useState } from "react";
import ServiceCard from "../../components/ServiceCard";
import { useQuery } from "@tanstack/react-query";
import { getAllServices } from "@/api/services/servicesApi";

export type ServiceType = {
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
  category: {
    name: string;
  };
};

const Services = () => {
  const [filter, setFilter] = useState("All");
  const [services, setServices] = useState<ServiceType[]>([]);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getAllServices,
  });

  useEffect(() => {
    if (data) {
      console.log("Fetched services:", data.data);
      setServices(data.data);
    }
  }, [data]);

  const filteredServices = services.filter((service) => {
    if (filter === "All") return true;
    return service.price <= parseInt(filter);
  });

  return (
    <div className="py-12 bg-zinc-50 text-zinc-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Explore Our Services</h1>
        <p className="text-lg mb-6">
          Browse through a variety of trusted services offered by our providers.
        </p>

        {/* Filter Section */}
        <div className="mb-8">
          <label className="mr-4 font-semibold">Filter by Price:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-200 p-2 rounded-lg"
          >
            <option value="All">All</option>
            <option value="50">Under $50</option>
            <option value="100">Under $100</option>
            <option value="200">Under $200</option>
          </select>
        </div>

        {/* Service Grid */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
        {isError && (
          <div className="text-center py-20 text-red-600">
            Error loading services. Please try again later.
          </div>
        )}
        {!isLoading && !isError && (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))] w-full">
            {filteredServices.map((service) => (
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
    </div>
  );
};

export default Services;
