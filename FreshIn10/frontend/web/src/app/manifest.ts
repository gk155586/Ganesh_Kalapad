import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreshIn10 - Groceries in 10 Minutes",
    short_name: "FreshIn10",
    description: "Ultra-fast grocery delivery at your doorstep.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/images/basket-3d.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
