"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { handleLogout } from "@/api/auth/authApi";
import toast from "react-hot-toast";
import { useSocketStore } from "@/stores/socketStore";
import { getTotalUnseenMessages } from "@/api/chat/chatApi";
import { getPendingCounts } from "@/api/bookings/bookingsApi";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { user, accessToken, logout } = useUserStore();
  const router = useRouter();
  const { data: pendingCount } = useQuery({
    queryKey: ["pendingBookingsCount", user?.id],
    queryFn: () => getPendingCounts(),
    enabled: user?.role === "PROVIDER" && !!accessToken,
  });

  const { data: unseenMessages } = useQuery({
    queryKey: ["unseenMessagesCount", user?.id],
    queryFn: () => getTotalUnseenMessages(),
    enabled: !!accessToken && !!user,
  });

  const logoutMutation = useMutation({
    mutationFn: () => handleLogout(),
    onSuccess: () => {
      toast.success("Logged out successfully.");
      logout();
      useSocketStore.getState().disconnect();
      router.push("/");
      setMenuOpen(false);
    },

    onError: (error) => {
      toast.error("Logout failed. Please try again.");
      console.error("Logout failed:", error);
    },
  });

  const handleLogoutClick = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="w-full border-b shadow-sm bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-3xl font-bold text-blue-600">
          Servix
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4 relative">
          {user && accessToken ? (
            <>
              <button
                onClick={handleLogoutClick}
                className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Logout
              </button>

              {/* Always show Dashboard for authenticated users */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDashboardOpen(!dashboardOpen);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Dashboard
                  <ChevronDown
                    size={16}
                    className={`transform transition-transform ${
                      dashboardOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {dashboardOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-zinc-100 border rounded-lg shadow-lg z-50 overflow-hidden">
                    {user?.role === "PROVIDER" && (
                      <div>
                        {" "}
                        <Link
                          href="/services/my-services"
                          onClick={() => setDashboardOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          My Services
                        </Link>
                        <Link
                          href="/bookings/bookings-for-provider"
                          onClick={() => setDashboardOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          Booking requests
                          {pendingCount && pendingCount.count !== 0 && (
                            <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-700 rounded-full w-5 h-5">
                              {pendingCount.count}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/create-service"
                          onClick={() => setDashboardOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          Create service
                        </Link>
                      </div>
                    )}
                    <Link
                      href="/bookings/my-bookings"
                      onClick={() => setDashboardOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/chat"
                      onClick={() => setDashboardOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      Chats
                      {unseenMessages?.totalUnseen !== 0 && unseenMessages && (
                        <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-700 rounded-full w-5 h-5">
                          {unseenMessages?.totalUnseen}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => {
                        setMenuOpen(false);
                        setDashboardOpen(false);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                    >
                      My Profile
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => {
            setMenuOpen(!menuOpen);
            setDashboardOpen(false);
          }}
          className="md:hidden text-gray-700 focus:outline-none"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 flex flex-col justify-center items-center relative">
          {user && accessToken ? (
            <>
              {/* Always show Dashboard */}
              <button
                onClick={() => setDashboardOpen(!dashboardOpen)}
                className="flex items-center justify-center w-full max-w-xs px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
              >
                Dashboard
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${
                    dashboardOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {dashboardOpen && (
                <div className="bg-zinc-100 rounded-lg w-full max-w-xs text-center py-2 mt-2 shadow-md">
                  {user?.role === "PROVIDER" && (
                    <>
                      <Link
                        href="/services/my-services"
                        onClick={() => {
                          setMenuOpen(false);
                          setDashboardOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        My Services
                      </Link>
                      <Link
                        href="/bookings/bookings-for-provider"
                        onClick={() => {
                          setMenuOpen(false);
                          setDashboardOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Booking requests
                        {pendingCount && pendingCount.count !== 0 && (
                          <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-700 rounded-full w-5 h-5">
                            {pendingCount.count}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/create-service"
                        onClick={() => {
                          setMenuOpen(false);
                          setDashboardOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Create Service
                      </Link>
                    </>
                  )}
                  <Link
                    href="/bookings/my-bookings"
                    onClick={() => {
                      setMenuOpen(false);
                      setDashboardOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    My Bookings
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setDashboardOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    Chats
                    {unseenMessages?.totalUnseen !== 0 && unseenMessages && (
                      <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-blue-700 rounded-full w-5 h-5">
                        {unseenMessages?.totalUnseen}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => {
                      setMenuOpen(false);
                      setDashboardOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    My Profile
                  </Link>
                </div>
              )}

              <button
                onClick={handleLogoutClick}
                className="w-full max-w-xs text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-medium text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
