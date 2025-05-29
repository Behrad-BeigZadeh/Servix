import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="bg-zinc-50 py-20 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-5xl font-bold text-gray-900 mb-6">
          Hire Trusted Professionals for Any Task
        </h1>
        <p className="text-lg text-zinc-900 mb-8">
          Servix connects you with skilled service providers for everything from
          cleaning to design — fast, easy, reliable.
        </p>
        <div className="flex justify-center gap-4 flex-wrap bg-primary text-zinc-900">
          <Link
            href="/services"
            className=" px-6 py-3 rounded-xl shadow-md transition border border-primary  hover:bg-blue-700  hover:text-zinc-50"
          >
            Explore Services
          </Link>
          <a
            href="/become-a-provider"
            className="px-6 py-3 rounded-xl shadow-md transition border border-primary hover:bg-blue-700 hover:text-zinc-50"
          >
            Become a Provider
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
