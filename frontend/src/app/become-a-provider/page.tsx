"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { useRouter } from "next/navigation";

const BecomeProviderPage = () => {
  const { user, accessToken } = useUserStore();
  const router = useRouter();

  const handleCreateServiceClick = () => {
    if (accessToken && user?.role === "PROVIDER") {
      console.log("Redirecting to /create-service");
      router.push("/create-service");
    } else {
      console.log("Redirecting to /auth/signup");
      router.push("/auth/signup");
    }
  };

  return (
    <main className="text-zinc-900 bg-zinc-50">
      {/* Hero Section */}
      <section className="pt-16 text-center px-4">
        <h1 className="text-4xl font-bold mb-4">
          Share Your Skills. Earn on Servix.
        </h1>
        <p className="text-lg text-zinc-600 max-w-xl mx-auto mb-6">
          Join a growing community of trusted service providers. Work on your
          schedule and grow your business with Servix.
        </p>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {[
          {
            title: "1. Create an Account",
            desc: "Sign up and set up your provider profile.",
          },
          {
            title: "2. List Your Service",
            desc: "Add photos, set prices, and write a great description.",
          },
          {
            title: "3. Start Getting Bookings",
            desc: "Receive requests, chat with clients, and get paid.",
          },
        ].map((step, i) => (
          <div
            key={i}
            className="shadow rounded-2xl p-6 flex flex-col items-center"
          >
            <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-600">{step.desc}</p>
          </div>
        ))}
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Become a Provider?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "Flexible schedule",
              "Real-time chat with clients",
              "Dashboard to manage bookings",
              "Secure payments",
            ].map((benefit, i) => (
              <div
                key={i}
                className="p-4 rounded-xl text-center text-sm text-zinc-700 shadow"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <button
          onClick={handleCreateServiceClick}
          className="bg-blue-700 hover:bg-blue-800 text-white text-lg px-6 py-2 rounded-xl"
        >
          List Your First Service
        </button>
      </section>
    </main>
  );
};

export default BecomeProviderPage;
