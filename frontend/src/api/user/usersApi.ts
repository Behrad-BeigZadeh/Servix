import api from "@/lib/axios";

const BASE_PATH = "/api/users";

export const fetchAuthUser = async () => {
  try {
    const res = await api.get(`${BASE_PATH}/auth-user`);
    return res.data;
  } catch (error) {
    console.log("Error fetching authenticated user:", error);
    throw error;
  }
};

export interface UpdateProfileData {
  avatar?: string;
  password?: string;
}

export const updateProfile = async (data: UpdateProfileData) => {
  try {
    const res = await api.put(`${BASE_PATH}/auth-user`, data);
    return res.data;
  } catch (error) {
    console.log("Error updating profile:", error);
    throw error;
  }
};
