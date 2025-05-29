"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useRefreshToken } from "@/hooks/useRefreshToken";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserStore } from "@/stores/userStore";
import { useSocketStore } from "@/stores/socketStore";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const { accessToken } = useUserStore();
  const connect = useSocketStore((state) => state.connect);
  useAuthInitializer();
  useRefreshToken();
  useNotifications();

  useEffect(() => {
    if (accessToken) {
      connect();
    }
  }, [accessToken, connect]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" />
      {children}
    </QueryClientProvider>
  );
}
