import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed hardcoded env to allow local .env.local to work properly
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
