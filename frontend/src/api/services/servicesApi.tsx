import axios from "axios";

export const createService = async (
  formData: {
    title: string;
    description: string;
    price: string;
    categoryId: string;
    image: File | null;
  },
  accessToken: string
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

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services`,
      data,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
  accessToken: string,
  serviceId: string
) => {
  const data = new FormData();
  data.append("title", formData.title);
  data.append("description", formData.description);
  data.append("categoryId", formData.categoryId);
  data.append("price", formData.price);
  if (formData.image) {
    data.append("image", formData.image);
  }

  try {
    const res = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services/${serviceId}`,
      data,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error updating service:", error);
    throw error;
  }
};
export const fetchCategories = async () => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories`,

      { withCredentials: true }
    );

    return res.data;
  } catch (err) {
    console.log("error in fetching categories", err);
    throw err;
  }
};

export const getAllServices = async () => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services`,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (err) {
    console.log("error in fetching services", err);
    throw err;
  }
};

export const getFeaturedServices = async () => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services/featured`,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (err) {
    console.log("error in fetching featured services", err);
    throw err;
  }
};

export const getSingleService = async (serviceId: string) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services/${serviceId}`,
      {
        withCredentials: true,
      }
    );

    return res.data;
  } catch (err) {
    console.log("error in fetching service", err);
    throw err;
  }
};

export const getProviderServices = async (
  providerId: string | undefined,
  accessToken: string | null
) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services/provider/${providerId}`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.log("error in fetching provider services", err);
    throw err;
  }
};

export const getPendingCounts = async (accessToken: string | null) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bookings/pending-count`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.log("error in fetching services", err);
    throw err;
  }
};
export const deleteService = async (
  serviceId: string | null,
  accessToken: string | null
) => {
  try {
    const res = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/services/${serviceId}`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.log("error in deleting service", err);
    throw err;
  }
};

export const fetchServicesByCategory = async (category: string) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/categories/services`,
      {
        params: { category },
      }
    );

    return res.data;
  } catch (err) {
    console.log("Error fetching services by category:", err);
    throw err;
  }
};
