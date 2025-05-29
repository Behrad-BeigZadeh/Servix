import axios from "axios";
import { SignupFormData } from "@/app/auth/signup/page";
import { LoginFormData } from "@/app/auth/login/page";

export const handleLogin = async (formData: LoginFormData) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error logging in:", error);
    throw error;
  }
};

export const handleSignup = async (formData: SignupFormData) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...dataToSend } = formData;
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`,
      dataToSend,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error logging in:", error);
    throw error;
  }
};

export const handleLogout = async () => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error logging out:", error);
    throw error;
  }
};
