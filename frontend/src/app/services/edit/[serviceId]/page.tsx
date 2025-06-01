"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  fetchCategories,
  getSingleService,
  updateService,
} from "@/api/services/servicesApi";
import { useUserStore } from "@/stores/userStore";
import { AxiosError } from "axios";
import { CreateServiceFormData } from "@/app/create-service/page";

const EditServicePage = () => {
  const { serviceId } = useParams();
  const router = useRouter();
  const { accessToken } = useUserStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    price: "",
    image: null as File | null,
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  const { data: serviceData, isLoading: isServiceLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getSingleService(serviceId as string),
    enabled: !!serviceId && !!accessToken,
  });

  const { data: categoryData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    if (categoryData) setCategories(categoryData);
  }, [categoryData]);

  useEffect(() => {
    if (serviceData) {
      const { title, description, price, categoryId } = serviceData;
      setFormData({
        title: title ?? "",
        description: description ?? "",
        price: price ?? "",
        categoryId: categoryId ?? "",
        image: null,
      });
    }
  }, [serviceData]);

  const mutation = useMutation({
    mutationFn: ({
      formData,
      serviceId,
    }: {
      formData: CreateServiceFormData;
      serviceId: string;
    }) => updateService(formData, serviceId),
    onSuccess: () => {
      toast.success("Service updated!");
      router.push("/services/my-services");
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
        toast.error("Failed to create service");
      }
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return toast.error("Unauthorized");
    mutation.mutate({ formData, serviceId: serviceId as string });
  };

  if (isServiceLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg my-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-zinc-800">
        Edit Service
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 p-3 rounded-lg"
          placeholder="Service title"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 p-3 rounded-lg h-24 resize-none"
          placeholder="Service description"
        />
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          required
          className="w-full border border-zinc-300 p-3 rounded-lg"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          name="price"
          value={formData.price}
          onChange={handleChange}
          type="number"
          required
          className="w-full border border-zinc-300 p-3 rounded-lg"
          placeholder="Price"
        />
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Service Image
          </label>
          <div className="flex items-center space-x-4">
            <label
              htmlFor="image-upload"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Choose File
            </label>
            <span className="text-sm text-zinc-600">
              {formData.image ? formData.image.name : "No file chosen"}
            </span>
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("Image must be under 5MB");
                  return;
                }
                setFormData((prev) => ({ ...prev, image: file }));
              }
            }}
            className="hidden"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
        >
          {mutation.isPending ? "Updating..." : "Update Service"}
        </button>
      </form>
    </div>
  );
};

export default EditServicePage;
