"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Stethoscope,
  BookOpen,
  ShieldCheck,
  Activity,
  Users,
  LogOut,
  ChevronDown,
  LogIn,
  UserPlus,
  Menu,
  X,
  Sparkles,
  Layers,
  HeartPulse,
} from "lucide-react";

export default function NavigationHeader() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userRole = user?.role;

  // Role-based avatar and badge theme
  const getRoleStyle = (r) => {
    switch (r) {
      case "doctor":
        return {
          gradient: "from-sky-500 to-medical-600",
          badge: "bg-sky-50 text-sky-700 border-sky-200",
          ring: "ring-sky-500/20",
          dot: "bg-sky-500",
        };
      case "admin":
        return {
          gradient: "from-purple-600 to-indigo-600",
          badge: "bg-purple-50 text-purple-700 border-purple-200",
          ring: "ring-purple-500/20",
          dot: "bg-purple-500",
        };
      case "receptionist":
        return {
          gradient: "from-teal-500 to-emerald-600",
          badge: "bg-teal-50 text-teal-700 border-teal-200",
          ring: "ring-teal-500/20",
          dot: "bg-teal-500",
        };
      default:
        return {
          gradient: "from-clinic-600 to-medical-500",
          badge: "bg-slate-100 text-slate-700 border-slate-200",
          ring: "ring-slate-500/20",
          dot: "bg-slate-500",
        };
    }
  };

  const roleStyle = getRoleStyle(userRole);

  return (
    <header className="sticky top-0 z-30 glass-header transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-clinic-600 via-teal-600 to-medical-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-clinic-700 transition">
                MedFlow<span className="text-clinic-600">AI</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-clinic-50 text-clinic-700 border border-clinic-200/70 tracking-wide uppercase">
                v2.4
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:inline tracking-tight">
              Clinical Intelligence & Knowledge Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {/* Knowledge Copilot - Accessible to all staff */}
          <Link
            href="/knowledge"
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              pathname === "/knowledge"
                ? "bg-clinic-50/80 text-clinic-800 border border-clinic-200/80 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <BookOpen className={`w-4 h-4 ${pathname === "/knowledge" ? "text-clinic-600" : "text-slate-400"}`} />
            <span>Knowledge Copilot</span>
          </Link>

          {/* Doctor Workspace - Doctor or Admin */}
          {(userRole === "doctor" || userRole === "admin") && (
            <Link
              href="/doctor"
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname === "/doctor"
                  ? "bg-medical-50/80 text-medical-800 border border-medical-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Activity className={`w-4 h-4 ${pathname === "/doctor" ? "text-medical-600" : "text-slate-400"}`} />
              <span>Doctor Workspace</span>
            </Link>
          )}

          {/* Receptionist Intake - Receptionist or Admin */}
          {(userRole === "receptionist" || userRole === "admin") && (
            <Link
              href="/receptionist"
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                pathname === "/receptionist"
                  ? "bg-teal-50/80 text-teal-800 border border-teal-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Users className={`w-4 h-4 ${pathname === "/receptionist" ? "text-teal-600" : "text-slate-400"}`} />
              <span>Receptionist Intake</span>
            </Link>
          )}

          {/* Admin Only - Staff Management & Document Manager */}
          {userRole === "admin" && (
            <>
              <Link
                href="/admin/staff"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname === "/admin/staff"
                    ? "bg-purple-50/80 text-purple-800 border border-purple-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Users className={`w-4 h-4 ${pathname === "/admin/staff" ? "text-purple-600" : "text-slate-400"}`} />
                <span>Staff Management</span>
              </Link>

              <Link
                href="/admin/knowledge"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  pathname === "/admin/knowledge"
                    ? "bg-purple-50/80 text-purple-800 border border-purple-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${pathname === "/admin/knowledge" ? "text-purple-600" : "text-slate-400"}`} />
                <span>Document Manager</span>
              </Link>
            </>
          )}
        </nav>

        {/* Auth Section & Mobile Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {loading ? (
            <div className="w-24 h-9 rounded-xl bg-slate-100 animate-pulse"></div>
          ) : user ? (
            /* Authenticated User Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition text-xs font-medium text-slate-700 shadow-xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-clinic-500/20"
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${roleStyle.gradient} text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs`}
                >
                  {user.name ? user.name[0] : "U"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-900 capitalize leading-tight max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`}></span>
                    {user.role}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Profile & Logout Dropdown Card (Linear / Shadcn style) */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 card-modern shadow-dropdown p-2.5 z-50 animate-fade-in text-xs space-y-2">
                  <div className="px-2 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                    <p className="text-slate-500 text-[11px] truncate mt-0.5">{user.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${roleStyle.badge}`}
                      >
                        {user.role} Account
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
                    </div>
                  </div>

                  {/* Quick Links inside Dropdown */}
                  <div className="space-y-0.5">
                    {user.role === "doctor" && (
                      <Link
                        href="/doctor"
                        className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-medical-50/80 text-slate-700 hover:text-medical-900 font-medium transition"
                      >
                        <Activity className="w-4 h-4 text-medical-600" />
                        <span>Doctor Clinical Workspace</span>
                      </Link>
                    )}

                    {userRole === "admin" && (
                      <>
                        <Link
                          href="/admin/staff"
                          className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-purple-50/80 text-slate-700 hover:text-purple-900 font-medium transition"
                        >
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>Staff Management</span>
                        </Link>
                        <Link
                          href="/admin/knowledge"
                          className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-purple-50/80 text-slate-700 hover:text-purple-900 font-medium transition"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>Document Manager</span>
                        </Link>
                      </>
                    )}

                    {user.role === "receptionist" && (
                      <Link
                        href="/receptionist"
                        className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-teal-50/80 text-slate-700 hover:text-teal-900 font-medium transition"
                      >
                        <Users className="w-4 h-4 text-teal-600" />
                        <span>Receptionist Intake</span>
                      </Link>
                    )}

                    <Link
                      href="/knowledge"
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl hover:bg-clinic-50/80 text-slate-700 hover:text-clinic-900 font-medium transition"
                    >
                      <BookOpen className="w-4 h-4 text-clinic-600" />
                      <span>Knowledge Copilot</span>
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Navigation Actions */
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs hover:shadow transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Clinic</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/knowledge"
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              pathname === "/knowledge"
                ? "bg-clinic-50 text-clinic-800 border border-clinic-200"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4 text-clinic-600" />
            <span>Knowledge Copilot</span>
          </Link>

          {(userRole === "doctor" || userRole === "admin") && (
            <Link
              href="/doctor"
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                pathname === "/doctor"
                  ? "bg-medical-50 text-medical-800 border border-medical-200"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Activity className="w-4 h-4 text-medical-600" />
              <span>Doctor Workspace</span>
            </Link>
          )}

          {(userRole === "receptionist" || userRole === "admin") && (
            <Link
              href="/receptionist"
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                pathname === "/receptionist"
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>Receptionist Intake</span>
            </Link>
          )}

          {userRole === "admin" && (
            <>
              <Link
                href="/admin/staff"
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === "/admin/staff"
                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span>Staff Management</span>
              </Link>
              <Link
                href="/admin/knowledge"
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  pathname === "/admin/knowledge"
                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Document Manager</span>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
