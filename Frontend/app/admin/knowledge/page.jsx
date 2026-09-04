"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  FileCheck,
  AlertTriangle,
  X,
  Info,
  Database,
  Search,
  Sparkles,
  ChevronRight,
  FileCode,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ModalOverlay from "@/components/ModalOverlay";

export default function AdminKnowledgePage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [category, setCategory] = useState("SOP");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [deleteModalDoc, setDeleteModalDoc] = useState(null);
  const [viewErrorDoc, setViewErrorDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch all documents
  const fetchDocuments = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge/documents", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        let errMsg = "Failed to load documents";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to load documents. Please ensure you are logged in as Admin.",
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, []);

  // Auto-poll if any document is in 'processing' status
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 3500);

    return () => clearInterval(interval);
  }, [documents]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (["pdf", "docx", "txt"].includes(ext)) {
        setSelectedFile(file);
        if (!docTitle) {
          setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        setFeedback({
          type: "error",
          message: "Only .pdf, .docx, and .txt files are supported.",
        });
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || isUploading) {
      setFeedback({ type: "error", message: "Please select a file to upload." });
      return;
    }

    setFeedback({ type: "", message: "" });
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", docTitle.trim() || selectedFile.name);
      formData.append("category", category);

      const res = await fetch("/api/admin/knowledge/documents", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload document");
      }

      setFeedback({
        type: "success",
        message: `Document "${docTitle || selectedFile.name}" uploaded successfully! OCR & vector indexing in progress.`,
      });

      // Reset form
      setSelectedFile(null);
      setDocTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      fetchDocuments(false);
    } catch (err) {
      console.error("Upload error:", err);
      setFeedback({ type: "error", message: err.message || "Error uploading document" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalDoc || isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/knowledge/documents/${deleteModalDoc._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete document");
      }

      setFeedback({
        type: "success",
        message: `Document and associated vector chunks removed from database.`,
      });

      setDeleteModalDoc(null);
      fetchDocuments(false);
    } catch (err) {
      console.error("Delete error:", err);
      setFeedback({ type: "error", message: err.message || "Error deleting document" });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunkCount || 0), 0);
  const indexedCount = documents.filter((d) => d.status === "indexed").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header & Refresh */}
        <div className="card-modern p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-medical-50 border border-medical-200/70 text-medical-700 text-xs font-semibold tracking-wide uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-medical-600 animate-pulse" />
              Clinical Knowledge Base & RAG Index
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Database className="w-6 h-6 text-medical-600" />
              Document Knowledge Manager
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Upload institutional clinical SOPs, triage guidelines, and hospital policies for automatic text chunking and Qdrant vector semantic indexing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => fetchDocuments(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 active:scale-[0.98] transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-medical-600" : "text-slate-500"}`} />
              <span>Refresh Index</span>
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="card-modern p-4.5 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Documents</p>
              <p className="text-xl font-bold tracking-tight text-slate-900">{documents.length}</p>
            </div>
          </div>

          <div className="card-modern p-4.5 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indexed Documents</p>
              <p className="text-xl font-bold tracking-tight text-emerald-700">{indexedCount}</p>
            </div>
          </div>

          <div className="card-modern p-4.5 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold flex-shrink-0 border border-medical-100">
              <Layers className="w-5 h-5 text-medical-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vector Chunks in Qdrant</p>
              <p className="text-xl font-bold tracking-tight text-medical-700">{totalChunks}</p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback.message && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm flex items-center space-x-3 border transition-all animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-xs"
                : "bg-rose-50/90 text-rose-800 border-rose-200 shadow-xs"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />
            )}
            <span className="flex-1 font-medium">{feedback.message}</span>
            <button
              onClick={() => setFeedback({ type: "", message: "" })}
              className="text-xs font-semibold px-2 py-1 rounded hover:bg-black/5 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Document Upload Zone */}
        <div className="card-modern p-5 sm:p-6 space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-600 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Upload Clinical SOP / Protocol</h2>
              <p className="text-[11px] text-slate-500">Automatically parsed, tokenized, and embedded into the vector database</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                selectedFile
                  ? "border-medical-500 bg-medical-50/30"
                  : "border-slate-200 hover:border-medical-400 hover:bg-slate-50/70"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  {selectedFile ? (
                    <span className="text-medical-700 font-bold">{selectedFile.name}</span>
                  ) : (
                    "Click to select or drag and drop clinical document"
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supported formats: PDF (with OCR fallback), DOCX, TXT (up to 15MB)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Dengue Clinical Management SOP 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition font-medium"
                >
                  <option value="SOP">Clinical SOP</option>
                  <option value="Emergency">Emergency Protocol</option>
                  <option value="HR Policy">HR & Administrative Policy</option>
                  <option value="Lab Protocol">Laboratory Protocol</option>
                  <option value="Pharmacy">Pharmacy & Medication Guidelines</option>
                  <option value="Other">Other Clinical Document</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="w-full py-3 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xs hover:shadow active:scale-[0.99]"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading & Ingesting Chunks...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Vectorize Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Documents Table */}
        <div className="card-modern overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-medical-100/70 text-medical-800 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Knowledge Documents</h2>
                <p className="text-[11px] text-slate-500">
                  {processingCount > 0
                    ? `⚡ ${processingCount} document(s) currently being processed and vectorized...`
                    : "All repository documents indexed and available for Doctor AI queries."}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold self-start sm:self-auto">
              <span>Total Docs:</span>
              <span className="text-medical-700 font-bold">{documents.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Document Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Chunks</th>
                  <th className="px-4 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-medical-600" />
                      <span className="text-xs font-medium">Loading clinical documents...</span>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No clinical documents found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Upload a clinical SOP above to populate the knowledge base.</p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/80 transition group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs uppercase flex-shrink-0 border border-slate-200">
                            {doc.fileType || "DOC"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-medical-700 transition">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{doc.originalFilename}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.category || "General"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {doc.status === "indexed" && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Indexed & Ready</span>
                          </span>
                        )}
                        {doc.status === "processing" && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                            <span>Processing Vectors</span>
                          </span>
                        )}
                        {doc.status === "failed" && (
                          <button
                            onClick={() => setViewErrorDoc(doc)}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition"
                            title="Click to view error reason"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Failed (View Error)</span>
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">
                          {doc.chunkCount || 0}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteModalDoc(doc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200"
                          title="Delete Document & Chunks"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Error Details Modal */}
        {viewErrorDoc && (
          <ModalOverlay className="animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-bold text-slate-900 text-sm">Document Ingestion Failed</h3>
                </div>
                <button
                  onClick={() => setViewErrorDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Document</span>
                  <p className="font-bold text-slate-800 mt-0.5">{viewErrorDoc.title}</p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Error Details</span>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-mono text-xs mt-1 break-words">
                    {viewErrorDoc.errorMessage || "Unknown ingestion pipeline error"}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setViewErrorDoc(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalDoc && (
          <ModalOverlay className="animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Clinical Document?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteModalDoc.title}"</span>?
                  This will permanently remove the document file and purge all associated vector embeddings from Qdrant.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setDeleteModalDoc(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-xs active:scale-[0.98]"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Document</span>
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </AuthGuard>
  );
}
