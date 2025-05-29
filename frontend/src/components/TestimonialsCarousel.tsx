"use client";

import React, { useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";

const testimonials = [
  {
    name: "Jane Doe",
    quote: "Servix made it so easy to find a reliable dog walker!",
    role: "Pet Owner",
  },
  {
    name: "Mike Johnson",
    quote: "I booked a home cleaning in minutes. Amazing experience.",
    role: "Homeowner",
  },
  {
    name: "Sarah Lee",
    quote: "The chat feature is super convenient for coordinating services.",
    role: "Tutor",
  },
];

const TestimonialsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const timer = useRef<NodeJS.Timeout | null>(null);

  const autoplay = useCallback(() => {
    if (!emblaApi) return;
    timer.current = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
  }, [emblaApi]);

  useEffect(() => {
    autoplay();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoplay]);

  return (
    <section className="py-12 text-zinc-900 flex flex-col items-center">
      <div className="container">
        <h2 className="text-xl sm:text-2xl text-zinc-900 font-bold mb-6 px-2 ">
          What People Say
        </h2>
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex w-full md:w-[50%] gap-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className=" flex-[0_0_100%]  rounded-2xl shadow-soft p-6 bg-zinc-100"
              >
                <p className="italic text-lg">“{testimonial.quote}”</p>
                <div className="mt-4 text-right text-zinc-900">
                  <p className="font-bold text-md">{testimonial.name}</p>
                  <p className="text-sm text-muted text-red-700">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
