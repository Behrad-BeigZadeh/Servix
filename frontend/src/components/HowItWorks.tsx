// components/HowItWorks.tsx
import React from "react";
import {
  Search,
  CalendarCheck,
  MessageCircle,
  CheckCircle,
} from "lucide-react";

const steps = [
  {
    icon: <Search className="w-8 h-8 text-primary mb-3" />,
    title: "Browse",
    description: "Find the service you need from trusted providers.",
  },
  {
    icon: <CalendarCheck className="w-8 h-8 text-primary mb-3" />,
    title: "Book",
    description: "Choose a time and date that works for you.",
  },
  {
    icon: <MessageCircle className="w-8 h-8 text-primary mb-3" />,
    title: "Chat",
    description: "Communicate with your provider in real-time.",
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-primary mb-3" />,
    title: "Get Service",
    description: "Sit back and enjoy professional, reliable help.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 text-zinc-900 flex flex-col items-center ">
      <div className="container">
        <h2 className="text-2xl font-bold mb-6 px-2">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {steps.map((step, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl shadow-soft hover:shadow-lg transition bg-zinc-50"
            >
              {step.icon}
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
