"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { handleLogin } from "@/api/auth/authApi";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { AxiosError } from "axios";
import { ZodErrorItem } from "../signup/page";
import { useSocketStore } from "@/stores/socketStore";

export type LoginFormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setAccessToken } = useUserStore();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const loginMutation = useMutation({
    mutationFn: (formData: LoginFormData) => handleLogin(formData),
    onSuccess: (data) => {
      const { accessToken, user } = data.data;
      toast.success("Login successful!");

      setUser(user);
      setAccessToken(accessToken);
      useSocketStore.getState().connect();
      router.push("/");
    },
    onError: (error: AxiosError<{ error: ZodErrorItem[] | string }>) => {
      const errData = error.response?.data?.error;

      if (Array.isArray(errData)) {
        errData.forEach((err) => {
          if (typeof err.message === "string") {
            toast.error(err.message);
          }
        });
      } else if (typeof errData === "string") {
        toast.error(errData);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    },
    onSettled: () => {
      setFormData({ email: "", password: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl p-8 sm:p-10 rounded-3xl w-full max-w-md space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-zinc-900">
          Login to Your Account
        </h2>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="mt-1 w-full h-11 px-4 rounded-xl bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>

          <label className="block relative">
            <span className="text-sm font-medium text-zinc-700">Password</span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="mt-1 w-full h-11 px-4 pr-10 rounded-xl bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              aria-label="Toggle password visibility"
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-xl transition duration-200"
        >
          {loginMutation.isPending ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
