"use client";

import KnowledgeChat from "@/components/KnowledgeChat";
import AuthGuard from "@/components/AuthGuard";
import { BookOpen, Sparkles } from "lucide-react";

export default function KnowledgePage() {
  return (
    <AuthGuard allowedRoles={["doctor", "admin", "receptionist"]}>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-4 px-5 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-clinic-50 text-clinic-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Clinical SOP & Protocol Query Assistant
              </h1>
              <p className="text-xs text-slate-500">
                AI-assisted knowledge retrieval grounded in official hospital guidelines
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            Qdrant Vector RAG
          </span>
        </div>
        <KnowledgeChat />
      </div>
    </AuthGuard>
  );
}
