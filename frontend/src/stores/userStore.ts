import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
}

interface UserStore {
  user: User | null;
  accessToken: string | null;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAccessToken: (accessToken: string) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "servix-user",
    }
  )
);
