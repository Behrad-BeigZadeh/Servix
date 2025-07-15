import { useEffect } from "react";
import axios from "axios";
import { useUserStore } from "@/stores/userStore";
import { useAuthTokenStore } from "@/stores/tokenStore";
import { handleLogout } from "@/api/auth/authApi";

export const useAuthInitializer = () => {
  const { setUser, logoutUser, setHasHydrated } = useUserStore();
  const { setAccessToken, logoutToken } = useAuthTokenStore();

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
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          await handleLogout();
          logoutUser();
          logoutToken();
        }
      } finally {
        setHasHydrated(true);
      }
    };

    tryRefresh();
  }, []);
};
