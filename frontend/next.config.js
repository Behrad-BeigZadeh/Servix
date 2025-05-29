/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/7.x/thumbs/svg*",
      },
    ],
    domains: ["images.pexels.com", "res.cloudinary.com"],
  },
};

module.exports = nextConfig;
