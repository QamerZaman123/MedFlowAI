import Link from "next/link";
import { BookOpen, ShieldCheck, Sparkles, Database, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="py-8 sm:py-12 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-clinic-50 border border-clinic-200 text-clinic-700 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zero-Hallucination Grounded AI</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          MedFlowAI <span className="text-clinic-600">Knowledge Assistant</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          Search clinical SOPs, emergency protocols, and hospital guidelines with guaranteed zero-hallucination accuracy, strict document citations, and real-time streaming inference.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-clinic-100 text-clinic-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Staff Knowledge Assistant</h2>
            <p className="text-sm text-slate-600">
              Ask clinical questions in natural language. Get instant answers with page & section citations directly sourced from your clinic’s verified documentation.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-clinic-500 flex-shrink-0" />
                <span>Real-time SSE token-by-token streaming</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-clinic-500 flex-shrink-0" />
                <span>Clickable citation chips with section & page details</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-clinic-500 flex-shrink-0" />
                <span>Automatic zero-match hallucination refusal</span>
              </li>
            </ul>
          </div>
          <div className="pt-6">
            <Link
              href="/knowledge"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-clinic-600 hover:bg-clinic-700 text-white font-medium shadow-sm hover:shadow transition-all"
            >
              Open Staff Assistant
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-medical-100 text-medical-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Admin Document Manager</h2>
            <p className="text-sm text-slate-600">
              Upload PDF, DOCX, and TXT guidelines. The automated OCR & chunking pipeline vectors documents directly into Qdrant for semantic search.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-medical-500 flex-shrink-0" />
                <span>OCR fallback with Tesseract for scanned PDFs</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-medical-500 flex-shrink-0" />
                <span>Live status tracking (processing, indexed, failed)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-medical-500 flex-shrink-0" />
                <span>One-click document & vector index purge</span>
              </li>
            </ul>
          </div>
          <div className="pt-6">
            <Link
              href="/admin/knowledge"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-medium shadow-sm hover:shadow transition-all"
            >
              Manage Documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
