import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/auth/", "/profile/", "/orders/", "/checkout/"],
    },
    sitemap: "https://freshin10.com/sitemap.xml",
  };
}
