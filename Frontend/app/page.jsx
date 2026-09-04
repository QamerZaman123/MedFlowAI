"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  ShieldCheck,
  Sparkles,
  Database,
  FileText,
  CheckCircle2,
  Activity,
  Users,
  ArrowRight,
  LogIn,
  UserPlus,
  Building2,
  Stethoscope,
  Lock,
  Cpu,
  Clock,
  HeartPulse,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="py-6 sm:py-10 max-w-6xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-clinic-50 border border-clinic-200/80 text-clinic-800 text-xs font-semibold uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-clinic-600" />
          <span>Role-Based Clinical Intelligence Suite</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          MedFlow<span className="bg-gradient-to-r from-clinic-700 via-teal-700 to-medical-600 bg-clip-text text-transparent">AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Deterministic hospital SOP retrieval, AI SOAP note generation, longitudinal patient digital twin timelines, and role-based clinical collaboration for modern hospitals.
        </p>

        {/* Dynamic Call To Action based on Auth state */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {loading ? (
            <div className="w-48 h-11 rounded-xl bg-slate-200 animate-pulse"></div>
          ) : user ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 px-2">
                Logged in as <strong className="text-slate-900 capitalize">{user.name}</strong> ({user.role})
              </span>

              {user.role === "doctor" && (
                <Link
                  href="/doctor"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-medical-600 to-clinic-600 hover:from-medical-700 hover:to-clinic-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <Activity className="w-4 h-4" />
                  <span>Enter Doctor Clinical Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {user.role === "admin" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/admin/staff"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Staff Management</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/admin/knowledge"
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 font-bold text-xs transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Document Ops</span>
                  </Link>
                </div>
              )}

              {user.role === "receptionist" && (
                <Link
                  href="/receptionist"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Receptionist Intake</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-medical-600 hover:from-clinic-700 hover:to-medical-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Staff Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition"
              >
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Register Clinic (Admin)</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
        <div className="card-modern p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-clinic-50 text-clinic-700 flex items-center justify-center font-black text-sm border border-clinic-100">
            0%
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Zero Hallucination</p>
            <p className="text-[10px] text-slate-500">Strict document citations</p>
          </div>
        </div>

        <div className="card-modern p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-700 flex items-center justify-center font-black text-sm border border-medical-100">
            768d
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Vector Retrieval</p>
            <p className="text-[10px] text-slate-500">Qdrant Cloud indexed</p>
          </div>
        </div>

        <div className="card-modern p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-sm border border-purple-100">
            SOAP
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">AI Clinical Copilot</p>
            <p className="text-[10px] text-slate-500">Structured note builder</p>
          </div>
        </div>

        <div className="card-modern p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm border border-teal-100">
            RBAC
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Role-Based Access</p>
            <p className="text-[10px] text-slate-500">Doctor · Admin · Reception</p>
          </div>
        </div>
      </div>

      {/* Feature Cards Matrix */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Doctor Workspace */}
        <div className="card-modern card-hover p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-700 flex items-center justify-center border border-medical-100">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-medical-50 text-medical-800 border border-medical-200">
              Doctors & Clinicians
            </span>
            <h2 className="text-lg font-bold text-slate-900">Doctor Workspace</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dictate or input raw consultation notes to generate structured medical SOAP notes. Query the patient's Digital Twin timeline and generate formal referral letters.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-medical-600 flex-shrink-0" />
                <span>Speech-to-text consultation dictation</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-medical-600 flex-shrink-0" />
                <span>Longitudinal Digital Twin Q&A</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-medical-600 flex-shrink-0" />
                <span>Formal referral & medical certificates</span>
              </li>
            </ul>
          </div>
          <div className="pt-3">
            <Link
              href="/doctor"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold shadow-xs transition"
            >
              Access Doctor Workspace
            </Link>
          </div>
        </div>

        {/* Knowledge Copilot */}
        <div className="card-modern card-hover p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-clinic-50 text-clinic-700 flex items-center justify-center border border-clinic-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-clinic-50 text-clinic-800 border border-clinic-200">
              All Hospital Staff
            </span>
            <h2 className="text-lg font-bold text-slate-900">Knowledge Copilot</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask natural language clinical questions. Answers are streamed live via SSE with exact document, section, and page citations grounded strictly in hospital protocols.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-clinic-600 flex-shrink-0" />
                <span>Deterministic document citations</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-clinic-600 flex-shrink-0" />
                <span>Zero-hallucination refusal floor</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-clinic-600 flex-shrink-0" />
                <span>Qdrant 768-dim vector retrieval</span>
              </li>
            </ul>
          </div>
          <div className="pt-3">
            <Link
              href="/knowledge"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-clinic-600 hover:bg-clinic-700 text-white text-xs font-bold shadow-xs transition"
            >
              Open Knowledge Copilot
            </Link>
          </div>
        </div>

        {/* Receptionist & Document Manager */}
        <div className="card-modern card-hover p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
              Ops & Reception
            </span>
            <h2 className="text-lg font-bold text-slate-900">Hospital Administration</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Admins can ingest PDF/DOCX SOPs with OCR fallback and manage Qdrant vectors. Receptionists can register walk-in patients and search the clinical directory.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span>Automated Tesseract OCR fallback</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span>Patient intake & vitals registration</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span>Real-time patient directory search</span>
              </li>
            </ul>
          </div>
          <div className="pt-3 flex items-center gap-2">
            <Link
              href="/admin/staff"
              className="inline-flex items-center justify-center w-1/2 px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-xs transition"
            >
              Staff Portal
            </Link>
            <Link
              href="/admin/knowledge"
              className="inline-flex items-center justify-center w-1/2 px-3 py-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 text-[11px] font-bold shadow-xs transition"
            >
              Document Ops
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
