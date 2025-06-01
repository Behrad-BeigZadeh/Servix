import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useUserStore } from "@/stores/userStore";
import { useSocketStore } from "@/stores/socketStore";
import { handleLogout } from "@/api/auth/authApi";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  withCredentials: true,
});

let isRefreshing = false;

api.interceptors.request.use(async (config) => {
  const { accessToken, setAccessToken, setUser, logout } =
    useUserStore.getState();

  if (!accessToken) return config;

  try {
    const { exp } = jwtDecode<{ exp: number }>(accessToken);
    const now = Date.now() / 1000;

    if (exp - now < 60 && !isRefreshing) {
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        config.headers.Authorization = `Bearer ${data.data.accessToken}`;

        // Reconnect socket after successful refresh
        useSocketStore.getState().connect();
      } catch (err) {
        console.error("Refresh token failed inside interceptor", err);
        await handleLogout();
        useSocketStore.getState().disconnect(); // Disconnect socket on failure
        logout();
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  } catch (err) {
    console.error("Failed to decode token or refresh", err);
    return config;
  }
});

export default api;
