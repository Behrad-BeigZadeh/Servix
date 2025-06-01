import api from "@/lib/axios";

export const createService = async (formData: {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  image: File | null;
}) => {
  try {
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("categoryId", formData.categoryId);
    data.append("price", formData.price);
    if (formData.image) {
      data.append("image", formData.image);
    }

    const res = await api.post("/api/services", data);
    return res.data;
  } catch (error) {
    console.log("Error creating service:", error);
    throw error;
  }
};

export const updateService = async (
  formData: {
    title: string;
    description: string;
    categoryId: string;
    price: string;
    image: File | null;
  },
  serviceId: string
) => {
  try {
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("categoryId", formData.categoryId);
    data.append("price", formData.price);
    if (formData.image) {
      data.append("image", formData.image);
    }

    const res = await api.put(`/api/services/${serviceId}`, data);
    return res.data;
  } catch (error) {
    console.log("Error updating service:", error);
    throw error;
  }
};

export const deleteService = async (serviceId: string | null) => {
  try {
    const res = await api.delete(`/api/services/${serviceId}`);
    return res.data;
  } catch (err) {
    console.log("Error deleting service:", err);
    throw err;
  }
};

export const getAllServices = async () => {
  try {
    const res = await api.get("/api/services");
    return res.data;
  } catch (err) {
    console.log("Error fetching services", err);
    throw err;
  }
};

export const getFeaturedServices = async () => {
  try {
    const res = await api.get("/api/services/featured");
    return res.data;
  } catch (err) {
    console.log("Error fetching featured services", err);
    throw err;
  }
};

export const getSingleService = async (serviceId: string) => {
  try {
    const res = await api.get(`/api/services/${serviceId}`);
    return res.data;
  } catch (err) {
    console.log("Error fetching service", err);
    throw err;
  }
};

export const getProviderServices = async (providerId: string | undefined) => {
  try {
    const res = await api.get(`/api/services/provider/${providerId}`);
    return res.data;
  } catch (err) {
    console.log("Error fetching provider services", err);
    throw err;
  }
};

export const fetchCategories = async () => {
  try {
    const res = await api.get("/api/categories");
    return res.data;
  } catch (err) {
    console.log("Error fetching categories", err);
    throw err;
  }
};

export const fetchServicesByCategory = async (category: string) => {
  try {
    const res = await api.get("/api/categories/services", {
      params: { category },
    });
    return res.data;
  } catch (err) {
    console.log("Error fetching services by category:", err);
    throw err;
  }
};
