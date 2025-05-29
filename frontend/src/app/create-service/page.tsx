"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createService, fetchCategories } from "@/api/services/servicesApi";
import { useUserStore } from "@/stores/userStore";
import { AxiosError } from "axios";

export type CreateServiceFormData = {
  title: string;
  description: string;
  categoryId: string;
  price: string;
  image: File | null;
};

const CreateServicePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<CreateServiceFormData>({
    title: "",
    description: "",
    categoryId: "",
    price: "",
    image: null as File | null,
  });
  const { accessToken, user } = useUserStore();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  const router = useRouter();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const mutation = useMutation({
    mutationFn: ({
      formData,
      accessToken,
    }: {
      formData: CreateServiceFormData;
      accessToken: string;
    }) => createService(formData, accessToken),
    onSuccess: () => {
      toast.success("Service created!");
      router.push("/services");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Not authenticated.");
      return;
    }

    if (!formData.image) {
      toast.error("Please upload an image.");
      return;
    }

    mutation.mutate({ formData, accessToken });
  };

  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data]);

  useEffect(() => {
    if (user && user.role !== "PROVIDER") {
      router.replace("/");
    }
  }, [user]);

  if (!user || user.role !== "PROVIDER") {
    return null;
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg my-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-zinc-800">
          Error fetching categories. Please try again.
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg my-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-zinc-800">
        Create a New Service
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          data-testid="create-service-form"
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Title
            </label>
            <input
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Service title"
              required
              className="w-full border border-zinc-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Service description"
              required
              className="w-full border border-zinc-300 p-3 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className="w-full border border-zinc-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Price
            </label>
            <input
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              type="number"
              placeholder="e.g. 50"
              required
              className="w-full border border-zinc-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="image"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              Service Image
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Choose File
              </button>
              <span className="text-sm text-zinc-600">
                {formData.image ? formData.image.name : "No file chosen"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              id="image"
              name="image"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            {mutation.isPending ? "Creating..." : "Create Service"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CreateServicePage;
