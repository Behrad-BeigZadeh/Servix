"use client";
import { fetchCategories } from "@/api/services/servicesApi";
import { useQuery } from "@tanstack/react-query";
import { JSX, useEffect, useState } from "react";
import {
  BookOpen,
  Truck,
  Wrench,
  Zap,
  MoveRight,
  Sparkles,
  PawPrint,
  Hammer,
  MonitorSmartphone,
  Leaf,
  Hammer as HammerAlt,
  Dumbbell,
  CalendarDays,
  Camera,
  Music,
  Languages,
  Scale,
  Banknote,
  Megaphone,
} from "lucide-react";
import { GiSoap } from "react-icons/gi";
import Link from "next/link";

const iconMap: Record<string, JSX.Element> = {
  Cleaning: <GiSoap className="w-8 h-8 mb-2 text-blue-600" />,
  Tutoring: <BookOpen className="w-8 h-8 mb-2 text-emerald-600" />,
  Delivery: <Truck className="w-8 h-8 mb-2 text-yellow-600" />,
  Plumbing: <Wrench className="w-8 h-8 mb-2 text-indigo-600" />,
  Electrician: <Zap className="w-8 h-8 mb-2 text-orange-600" />,
  Moving: <MoveRight className="w-8 h-8 mb-2 text-red-500" />,
  "Beauty & Wellness": <Sparkles className="w-8 h-8 mb-2 text-pink-500" />,
  "Pet Care": <PawPrint className="w-8 h-8 mb-2 text-teal-500" />,
  "Home Repair": <Hammer className="w-8 h-8 mb-2 text-gray-700" />,
  "Tech Support": <MonitorSmartphone className="w-8 h-8 mb-2 text-cyan-700" />,
  Gardening: <Leaf className="w-8 h-8 mb-2 text-green-600" />,
  Carpentry: <HammerAlt className="w-8 h-8 mb-2 text-yellow-800" />,
  "Fitness Training": <Dumbbell className="w-8 h-8 mb-2 text-purple-700" />,
  "Event Planning": <CalendarDays className="w-8 h-8 mb-2 text-rose-600" />,
  Photography: <Camera className="w-8 h-8 mb-2 text-gray-800" />,
  "Music Lessons": <Music className="w-8 h-8 mb-2 text-indigo-500" />,
  "Language Lessons": <Languages className="w-8 h-8 mb-2 text-teal-700" />,
  "Legal Help": <Scale className="w-8 h-8 mb-2 text-red-700" />,
  Accounting: <Banknote className="w-8 h-8 mb-2 text-green-700" />,
  Marketing: <Megaphone className="w-8 h-8 mb-2 text-blue-800" />,
};

const ServiceCategories = () => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const { data, isError, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data]);

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-lg my-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-zinc-800">
          Error fetching categories. Please try again.
        </h1>
      </div>
    );
  }

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <section className="py-16 bg-zinc-50 text-zinc-900">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-10">
              Browse Services by Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  href={`/categories/${cat.name}?category=${encodeURIComponent(
                    cat.name
                  )}`}
                  key={cat.id}
                >
                  <div className="flex flex-col items-center p-6 bg-zinc-100 rounded-xl shadow hover:shadow-md transition hover:scale-105 cursor-pointer">
                    {iconMap[cat.name] ?? (
                      <Sparkles className="w-8 h-8 mb-2 text-zinc-500" />
                    )}
                    <div className="text-lg font-medium">{cat.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ServiceCategories;
