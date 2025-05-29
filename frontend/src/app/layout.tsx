import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Servix | Find & Offer Services",
  description: "Service marketplace for everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-zinc-50">
      <body className=" font-sans min-h-screen flex flex-col">
        <ClientProviders>
          <Navbar />
          <main className="flex-grow w-full">{children}</main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
