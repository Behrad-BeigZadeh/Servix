import { useEffect } from "react";
import axios from "axios";
import { useUserStore } from "@/stores/userStore";
import { useSocketStore } from "@/stores/socketStore";

export const useAuthInitializer = () => {
  const { setAccessToken, setUser, logout } = useUserStore();

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        useSocketStore.getState().connect();

        console.log(" Session restored from refresh token");
      } catch (err) {
        logout();
        console.log(" No valid session", err);
      }
    };

    tryRefresh();
  }, []);
};
