"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuthStore();
  const { syncCart } = useCartStore();
  const [showPassword, setShowPassword] = useState(false);

  // 3D Tilt Effect Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const redirect = searchParams.get("redirect") || "/";

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      await syncCart();
      toast.success("Welcome back! 🎉");
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Login failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    if (redirect !== "/") {
      sessionStorage.setItem("auth_redirect", redirect);
    }
    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background Image with Blur and Overlay */}
      <div 
        className="absolute inset-0 z-0 scale-105"
        style={{
          backgroundImage: "url('/images/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px) brightness(0.4)",
        }}
      />
      
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
      >
        {/* LEFT PANEL - Side Image & Branding */}
        <div className="relative hidden lg:block overflow-hidden group">
          <div 
            className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: "url('/images/login-side.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
          
          <div className="relative z-20 h-full flex flex-col justify-between p-12 text-white">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-green-600 font-black text-2xl">F</span>
              </div>
              <span className="font-black text-3xl tracking-tight">
                Fresh<span className="text-green-400">In10</span>
              </span>
            </Link>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-5xl font-black leading-tight mb-4">
                  Freshness <br />
                  <span className="text-green-400">Delivered</span> <br />
                  in 10 Minutes.
                </h2>
                <p className="text-slate-300 text-lg max-w-md font-medium">
                  Experience the future of grocery shopping with our ultra-fast delivery service.
                </p>
              </motion.div>

              <div className="flex flex-col gap-4">
                {[
                  "100% Organic & Fresh Produce",
                  "Fastest Delivery in the City",
                  "Over 5000+ Items in Stock"
                ].map((text, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-slate-400 text-sm font-medium">
              © 2024 FreshIn10. All rights reserved.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white/5 backdrop-blur-md">
          <div className="mb-10 lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-black text-3xl text-white">
                Fresh<span className="text-green-500">In10</span>
              </span>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome Back</h1>
              <p className="text-slate-400 font-medium">Please enter your details to sign in</p>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 py-4 rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98] group mb-8"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-4 text-slate-500 font-bold tracking-widest">or email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08]"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400 font-bold ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-300">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-green-500 font-bold hover:text-green-400">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400 font-bold ml-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-[0_10px_20px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all disabled:opacity-50 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-slate-400 font-medium">
                New to FreshIn10?{" "}
                <Link
                  href={`/auth/register${redirect !== "/" ? `?redirect=${redirect}` : ""}`}
                  className="text-white font-black hover:text-green-400 transition-colors underline decoration-green-500 underline-offset-4"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Decorative floating elements */}
      <div className="absolute bottom-10 left-10 z-20 hidden md:flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl animate-bounce pointer-events-none">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Join 10k+ customers</p>
          <p className="text-slate-400 text-xs">Shopping fresh every day</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
