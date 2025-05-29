"use client";
import { useEffect } from "react";
import axios from "axios";
import { useUserStore } from "@/stores/userStore";
import { handleLogout } from "@/api/auth/authApi";
import toast from "react-hot-toast";
import { useSocketStore } from "@/stores/socketStore";

export const useRefreshToken = () => {
  const { setAccessToken, setUser, logout, user } = useUserStore();

  useEffect(() => {
    if (!user) return;

    const refresh = async () => {
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        useSocketStore.getState().connect();

        console.log("✅ Token refreshed");
      } catch (err) {
        console.error("🔴 Refresh token failed", err);
        toast.error("Session expired. Please log in again.");
        await handleLogout();
        useSocketStore.getState().disconnect();
        logout();
      }
    };

    refresh();

    const interval = setInterval(refresh, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [logout, setAccessToken, setUser]);
};
