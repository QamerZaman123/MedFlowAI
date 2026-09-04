"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const handleRedirect = (role) => {
    if (redirectParam) {
      router.push(redirectParam);
      return;
    }

    if (role === "doctor") {
      router.push("/doctor");
    } else if (role === "admin") {
      router.push("/admin/knowledge");
    } else if (role === "receptionist") {
      router.push("/receptionist");
    } else {
      router.push("/knowledge");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      handleRedirect(loggedUser.role);
    } catch (err) {
      setErrorMsg(err.message || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full space-y-7">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-clinic-50 border border-clinic-200/80 text-clinic-800 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-clinic-500" />
            <span>Authorized Medical Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Sign In to <span className="bg-gradient-to-r from-clinic-700 via-teal-700 to-medical-600 bg-clip-text text-transparent">MedFlowAI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Clinical staff (Doctors &amp; Receptionists) access workspaces with credentials provisioned by Hospital Administration.
          </p>
        </div>



        {/* Main Login Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-card space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@medflow.demo"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-clinic-500/20 focus:border-clinic-500 text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-clinic-500/20 focus:border-clinic-500 text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-medical-600 hover:from-clinic-700 hover:to-medical-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Clinical Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Need to onboard a new clinic or hospital facility?{" "}
            <Link
              href="/register"
              className="font-bold text-purple-600 hover:text-purple-700 hover:underline transition"
            >
              Register Facility (Admin)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400 text-xs">Loading medical portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
