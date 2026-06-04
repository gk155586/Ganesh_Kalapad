"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const { syncCart } = useCartStore();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        const errorMessages: Record<string, string> = {
          no_code: "Authorization code not received",
          oauth_not_configured: "Google OAuth is not configured",
          token_exchange_failed: "Failed to exchange authorization code",
          no_email: "Email not provided by Google",
          account_deactivated: "Your account has been deactivated",
          oauth_failed: "Google login failed. Please try again",
        };

        toast.error(errorMessages[error] || "Login failed");
        router.push("/auth/login");
        return;
      }

      if (!accessToken || !refreshToken) {
        toast.error("Invalid authentication response");
        router.push("/auth/login");
        return;
      }

      try {
        // Store tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Fetch user data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const user = await response.json();
        
        // Update auth store
        const { setTokens, setUser } = useAuthStore.getState();
        setTokens(accessToken);
        setUser(user);

        // Fetch cart
        await syncCart();

        // Get redirect URL from session storage
        const redirect = sessionStorage.getItem("auth_redirect") || "/";
        sessionStorage.removeItem("auth_redirect");

        toast.success(`Welcome back, ${user.name}! 🎉`);
        router.push(redirect);
      } catch (err) {
        console.error("Callback error:", err);
        toast.error("Failed to complete login");
        router.push("/auth/login");
      }
    };

    handleCallback();
  }, [searchParams, router, setUser, syncCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we set up your account</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
