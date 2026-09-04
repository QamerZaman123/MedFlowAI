"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ShieldAlert, ArrowRight, LogOut, Stethoscope, Activity, Users, ShieldCheck, Lock } from "lucide-react";

export default function AuthGuard({ children, allowedRoles = [] }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  // Loading state with modern medical SaaS skeleton & spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-clinic-50 to-medical-50 border border-clinic-200/80 flex items-center justify-center shadow-xs">
            <Stethoscope className="w-6 h-6 text-clinic-600 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clinic-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-clinic-500"></span>
          </span>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-slate-800 tracking-wide uppercase">Verifying Clinical Credentials</p>
          <p className="text-[11px] text-slate-400">Authenticating session token & permissions...</p>
        </div>
      </div>
    );
  }

  // Not logged in (redirecting)
  if (!user) {
    return null;
  }

  // Role verification check
  const isRoleAuthorized = allowedRoles.length === 0 || allowedRoles.includes(user.role);

  if (!isRoleAuthorized) {
    // Determine the user's primary workspace URL based on their actual role
    const defaultWorkspace =
      user.role === "doctor"
        ? { name: "Doctor Workspace", path: "/doctor", icon: Activity }
        : user.role === "admin"
        ? { name: "Document Manager", path: "/admin/knowledge", icon: ShieldCheck }
        : { name: "Receptionist Intake", path: "/receptionist", icon: Users };

    const WorkspaceIcon = defaultWorkspace.icon;

    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200/90 shadow-dropdown space-y-6 text-center animate-in fade-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            HTTP 403 · Restricted Area
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Role Permission Required</h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            You are signed in as <span className="font-bold text-slate-900 capitalize">{user.name}</span> (<span className="font-semibold text-rose-700 uppercase">{user.role}</span>).
            This workspace is reserved for:{" "}
            <span className="font-bold text-slate-800 uppercase">
              {allowedRoles.join(", ")}
            </span>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href={defaultWorkspace.path}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
          >
            <WorkspaceIcon className="w-3.5 h-3.5" />
            <span>Open {defaultWorkspace.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}
