"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { handleSignup } from "@/api/auth/authApi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { AxiosError } from "axios";
import { useSocketStore } from "@/stores/socketStore";

export type SignupFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

export type ZodErrorItem = { message: string };

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setUser, setAccessToken } = useUserStore();
  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const signupMutation = useMutation({
    mutationFn: (formData: SignupFormData) => handleSignup(formData),
    onSuccess: (data) => {
      const { accessToken, user } = data.data;
      toast.success("Signup successful!");
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
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    signupMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl p-8 sm:p-10 rounded-3xl w-full max-w-md space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-zinc-900">
          Create an Account
        </h2>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Username</span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="mt-1 w-full h-11 px-4 rounded-xl bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </label>

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
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          <label className="block relative">
            <span className="text-sm font-medium text-zinc-700">
              Confirm Password
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="mt-1 w-full h-11 px-4 pr-10 rounded-xl bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Role</span>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="mt-1 w-full h-11 px-4 rounded-xl bg-zinc-100 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a role</option>
              <option value="CLIENT">Client</option>
              <option value="PROVIDER">Provider</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={signupMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 rounded-xl transition duration-200"
        >
          {signupMutation.isPending ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
