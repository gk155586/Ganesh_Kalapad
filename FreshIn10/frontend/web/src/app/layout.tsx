import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "react-hot-toast";
import { JsonLd } from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://freshin10.com"), // Replace with actual domain if different
  title: {
    default: "FreshIn10 - Groceries Delivered in 10 Minutes",
    template: "%s | FreshIn10",
  },
  description:
    "FreshIn10 is your ultra-fast grocery delivery partner. Get fresh vegetables, fruits, dairy, snacks, and daily essentials delivered to your doorstep in just 10 minutes.",
  keywords: [
    "FreshIn10",
    "Fresh In 10",
    "grocery delivery",
    "10 minute delivery",
    "online grocery store",
    "fresh vegetables delivery",
    "fresh fruits online",
    "dairy delivery",
    "instant grocery delivery",
    "fastest grocery app",
  ],
  authors: [{ name: "FreshIn10 Team" }],
  creator: "FreshIn10",
  publisher: "FreshIn10",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "FreshIn10 - Groceries in 10 Minutes",
    description: "Ultra-fast grocery delivery at your doorstep. Freshness delivered in 10 minutes.",
    url: "https://freshin10.com",
    siteName: "FreshIn10",
    images: [
      {
        url: "/images/basket-3d.png", // Using existing 3D asset as OG image for now
        width: 1200,
        height: 630,
        alt: "FreshIn10 Grocery Delivery",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreshIn10 - Groceries in 10 Minutes",
    description: "Ultra-fast grocery delivery at your doorstep.",
    images: ["/images/basket-3d.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE", // User should replace this
  },
  alternates: {
    canonical: "https://freshin10.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <JsonLd />
      </head>
      <body className="bg-gray-50 font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1f2937",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#16a34a", secondary: "#fff" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
