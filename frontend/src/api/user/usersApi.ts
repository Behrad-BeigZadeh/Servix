import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`;

export const fetchAuthUser = async (accessToken: string | null) => {
  try {
    const res = await axios.get(`${BASE_URL}/auth-user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

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

export const updateProfile = async (
  accessToken: string | null,
  data: UpdateProfileData
) => {
  try {
    const res = await axios.put(`${BASE_URL}/auth-user`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.log("Error updating profile:", error);
    throw error;
  }
};

export const fetchPublicProfile = async (userId: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/${userId}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error) {
    console.log("Error fetching public profile:", error);
    throw error;
  }
};

export const fetchUserServices = async (userId: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/${userId}/services`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error) {
    console.log("Error fetching user services:", error);
    throw error;
  }
};
