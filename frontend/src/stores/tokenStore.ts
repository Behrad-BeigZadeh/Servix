import { create } from "zustand";

interface AuthTokenStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logoutToken: () => void;
}

export const useAuthTokenStore = create<AuthTokenStore>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  logoutToken: () => set({ accessToken: null }),
}));
