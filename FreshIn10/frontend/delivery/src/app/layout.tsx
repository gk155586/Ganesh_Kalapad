import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { DeliveryNav } from "@/components/DeliveryNav";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FreshIn10 — Delivery Partner",
  description: "FreshIn10 Delivery Partner App",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { EditorBridge } from "@/components/EditorBridge";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EditorBridge />
        <ThemeProvider>
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          <DeliveryNav>{children}</DeliveryNav>
        </ThemeProvider>
      </body>
    </html>
  );
}
