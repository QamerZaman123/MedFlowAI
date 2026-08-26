"use client";

/**
 * Inspection Note:
 * Feature 1 (Consultation Copilot) and Feature 2 (Patient Timeline) exist as backend stubs in DoctorController.js.
 * This unified layout provides role-aware navigation linking Knowledge Copilot, Doctor Workspace, and Admin Document Manager
 * into a coherent, single-application workflow.
 */

import "./globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Stethoscope,
  BookOpen,
  ShieldCheck,
  Activity,
  Users,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState({
    name: "Dr. Staff User",
    email: "doctor@medflowai.local",
    role: "doctor",
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Fetch authenticated user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/get-user-data", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.userData) {
            setCurrentUser(data.userData);
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile:", err.message);
      }
    };

    fetchUserData();
  }, []);

  const userRole = currentUser?.role || "doctor";

  return (
    <html lang="en">
      <head>
        <title>MedFlowAI - Clinical Intelligence Platform</title>
        <meta name="description" content="Grounded Clinical Intelligence, Decision Support & Knowledge Assistant" />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased">
        {/* Navigation Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-clinic-600 to-medical-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold bg-gradient-to-r from-clinic-700 to-medical-600 bg-clip-text text-transparent">
                    MedFlowAI
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-clinic-100 text-clinic-800 border border-clinic-200 uppercase">
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:inline">
                  Clinical Intelligence & Knowledge Suite
                </span>
              </div>
            </Link>

            {/* Role-Aware Navigation Links */}
            <nav className="flex items-center space-x-1 sm:space-x-3">
              {/* All Staff */}
              <Link
                href="/knowledge"
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  pathname === "/knowledge"
                    ? "bg-clinic-50 text-clinic-700 font-semibold border border-clinic-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-4 h-4 text-clinic-600" />
                <span>Knowledge Copilot</span>
              </Link>

              {/* Doctor / Admin */}
              {(userRole === "doctor" || userRole === "admin") && (
                <Link
                  href="/doctor"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    pathname === "/doctor"
                      ? "bg-medical-50 text-medical-700 font-semibold border border-medical-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Activity className="w-4 h-4 text-medical-600" />
                  <span>Doctor Workspace</span>
                </Link>
              )}

              {/* Receptionist / Admin */}
              {(userRole === "receptionist" || userRole === "admin") && (
                <Link
                  href="/receptionist"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    pathname === "/receptionist"
                      ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Receptionist Intake</span>
                </Link>
              )}

              {/* Admin Only */}
              {userRole === "admin" && (
                <Link
                  href="/admin/knowledge"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    pathname === "/admin/knowledge"
                      ? "bg-purple-50 text-purple-700 font-semibold border border-purple-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Document Manager</span>
                </Link>
              )}
            </nav>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs font-medium text-slate-700"
              >
                <div className="w-6 h-6 rounded-lg bg-clinic-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {userRole[0]}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-900 capitalize leading-tight">
                    {currentUser?.name || "Staff"}
                  </span>
                  <span className="text-[10px] text-clinic-700 font-semibold uppercase">
                    {userRole}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Quick Role Simulation Menu for Demo */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 text-xs">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Demo Role Switcher
                  </p>
                  <button
                    onClick={() => {
                      setCurrentUser({ name: "Dr. Sarah Chen", email: "doctor@medflowai.local", role: "doctor" });
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      userRole === "doctor" ? "bg-medical-50 text-medical-700 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>Doctor (Clinical View)</span>
                    {userRole === "doctor" && <span className="w-2 h-2 rounded-full bg-medical-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentUser({ name: "Admin Administrator", email: "admin@medflowai.local", role: "admin" });
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      userRole === "admin" ? "bg-purple-50 text-purple-700 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>Admin (Full Access)</span>
                    {userRole === "admin" && <span className="w-2 h-2 rounded-full bg-purple-600" />}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentUser({ name: "Receptionist Onboarding", email: "receptionist@medflowai.local", role: "receptionist" });
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      userRole === "receptionist" ? "bg-emerald-50 text-emerald-700 font-bold" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>Receptionist</span>
                    {userRole === "receptionist" && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MedFlowAI. Unified Clinical Intelligence & Zero-Hallucination Grounding.</p>
        </footer>
      </body>
    </html>
  );
}
