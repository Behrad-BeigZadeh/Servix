"use client";
import React, { useEffect, useState } from "react";
import { useUserStore } from "@/stores/userStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { fetchAuthUser, updateProfile } from "@/api/user/usersApi";
import { AxiosError } from "axios";

const MyProfile = () => {
  const { accessToken, setUser } = useUserStore();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: "",
    password: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["authUser"],
    queryFn: () => fetchAuthUser(accessToken),
  });

  const updateMutation = useMutation({
    mutationFn: (updatedData: typeof formData) =>
      updateProfile(accessToken, updatedData),
    onSuccess: (data) => {
      setUser(data.data);
      toast.success("Profile updated!");
      setEditMode(false);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      if (error.response?.data?.error) {
        const errors = error.response.data.error;

        if (Array.isArray(errors)) {
          errors.forEach((err) => {
            toast.error(err.message || "Validation error");
          });
        } else if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Something went wrong");
        }
      } else {
        toast.error("Failed to update profile");
      }
    },
  });

  useEffect(() => {
    if (data?.data) {
      const { username, email, avatar } = data.data;
      setFormData((prev) => ({
        ...prev,
        username: username || "",
        email: email || "",
        avatar: avatar || "",
      }));
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mt-10">
        <p className="font-semibold">Error loading profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>

      <div className="flex justify-center mb-6">
        {formData.avatar ? (
          <img
            src={formData.avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full border object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border bg-gray-200 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>

      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty to keep current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Avatar URL</label>
            <input
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <p>
            <strong>Username:</strong> {formData.username}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          <button
            onClick={() => setEditMode(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
