"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";

export default function RegisterClinicPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !email || !password || !confirmPassword) {
      setErrorMsg("All fields are required to register your clinic.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Clinic registration strictly provisions the Clinic Administrator account
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "admin",
      });

      // Redirect new admin to the staff management portal to begin provisioning doctors
      router.push("/admin/staff");
    } catch (err) {
      setErrorMsg(err.message || "Clinic registration failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Clinic & Hospital Onboarding</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Register Your <span className="bg-gradient-to-r from-purple-700 via-indigo-700 to-clinic-700 bg-clip-text text-transparent">Clinic</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Provision your hospital administrator account. Once registered, you can provision Doctor and Receptionist credentials from the Admin Staff Portal.
          </p>
        </div>

        {/* Notice for Clinicians and Staff */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start space-x-3 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Are you a Doctor, Clinician, or Receptionist?</p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Clinical accounts are not registered publicly. Your Clinic Administrator will provision your login credentials. Please contact your facility administrator or{" "}
              <Link href="/login" className="font-bold underline hover:text-amber-950">
                Sign In here
              </Link>{" "}
              with your provided staff email.
            </p>
          </div>
        </div>

        {/* Main Clinic Registration Card */}
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
            {/* Clinic / Admin Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Clinic Administrator Username / Facility Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. CityGeneralHospitalAdmin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition"
                />
              </div>
            </div>

            {/* Official Hospital Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Hospital / Administrator Email
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
                  placeholder="admin@hospital.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm bg-slate-50/50 hover:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Role Badge Indicator */}
            <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-purple-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Assigned Account Role:</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-purple-200/70 text-purple-900 border border-purple-300/80">
                Clinic Administrator
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Provisioning Facility...</span>
                </>
              ) : (
                <>
                  <span>Complete Clinic Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Already registered your clinic?{" "}
            <Link
              href="/login"
              className="font-bold text-purple-600 hover:text-purple-700 hover:underline transition"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
