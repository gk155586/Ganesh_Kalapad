"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, CheckCircle, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const passwordChecks = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains number", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

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

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });
      toast.success("Account created! Welcome to FreshIn10 🎉");
      router.push("/");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    }
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
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
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
                  Join the <br />
                  <span className="text-green-400">Fresh</span> <br />
                  Revolution.
                </h2>
                <p className="text-slate-300 text-lg max-w-md font-medium">
                  Create an account and get your first delivery free. Fresh groceries at your doorstep in minutes.
                </p>
              </motion.div>

              <div className="flex flex-col gap-4">
                {[
                  "Exclusive Member Offers",
                  "Personalized Recommendations",
                  "Priority Delivery Slots"
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

        {/* RIGHT PANEL - Register Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/5 backdrop-blur-md overflow-y-auto max-h-[90vh] lg:max-h-none">
          <div className="mb-8 lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-black text-3xl text-white">
                Fresh<span className="text-green-500">In10</span>
              </span>
            </Link>
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Create Account</h1>
              <p className="text-slate-400 font-medium">Start your fresh journey today</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                  <input
                    {...register("name")}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08] text-sm"
                  />
                </div>
                {errors.name && <p className="text-[10px] text-red-400 font-bold ml-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08] text-sm"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-400 font-bold ml-1">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="9876543210"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08] text-sm"
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] text-red-400 font-bold ml-1">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-400 font-bold ml-1">{errors.password.message}</p>}
                
                {/* Password strength */}
                {password && (
                  <div className="mt-2 flex gap-3 flex-wrap">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1.5">
                        <CheckCircle
                          className={`w-3 h-3 ${check.test(password) ? "text-green-400" : "text-slate-600"}`}
                        />
                        <span className={`text-[10px] font-bold ${check.test(password) ? "text-green-500" : "text-slate-500"}`}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all hover:bg-white/[0.08] text-sm"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-red-400 font-bold ml-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-black text-lg shadow-[0_10px_20px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all disabled:opacity-50 active:scale-95 overflow-hidden mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400 font-medium">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-white font-black hover:text-green-400 transition-colors underline decoration-green-500 underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Decorative floating elements */}
      <div className="absolute top-10 right-10 z-20 hidden md:flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl animate-pulse pointer-events-none">
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Join the community</p>
          <p className="text-slate-400 text-xs">Freshness awaits you</p>
        </div>
      </div>
    </div>
  );
}
