import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import NavigationHeader from "@/components/NavigationHeader";

export const metadata = {
  title: "MedFlowAI — Clinical Intelligence Platform",
  description: "Zero-Hallucination Hospital SOP Retrieval, AI SOAP Notes & Patient Digital Twin Timelines",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-medical-100 selection:text-medical-900">
        <AuthProvider>
          {/* Subtle Ambient Top Glow */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-medical-100/40 via-clinic-50/20 to-transparent pointer-events-none -z-10 blur-[100px] opacity-70" />

          {/* Sticky Navigation */}
          <NavigationHeader />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          {/* Modern Healthcare SaaS Footer */}
          <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200/80 py-4 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-slate-600">MedFlowAI Clinical Systems Operational</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 hidden md:inline">HIPAA-Aligned Architecture & Zero-Hallucination Grounding</span>
              </div>

              <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                <span>© {new Date().getFullYear()} MedFlowAI Inc.</span>
                <span className="text-slate-300">·</span>
                <span>v2.4 Enterprise</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
