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
} from "lucide-react";

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-medical-600" />
            Clinic Knowledge Document Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload clinical SOPs and protocols to automate OCR, chunking, and Qdrant vector indexing
          </p>
        </div>

        <button
          onClick={() => fetchDocuments(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Documents</p>
            <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indexed Documents</p>
            <p className="text-2xl font-bold text-emerald-700">{indexedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-clinic-50 text-clinic-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vector Chunks in Qdrant</p>
            <p className="text-2xl font-bold text-clinic-700">{totalChunks}</p>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
          <button
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Document Upload Zone */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-medical-600" />
          Upload New Clinical Document
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
              selectedFile
                ? "border-clinic-500 bg-clinic-50/40"
                : "border-slate-300 hover:border-medical-500 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedFile ? (
                  <span className="text-clinic-700 font-bold">{selectedFile.name}</span>
                ) : (
                  "Drag and drop your file here, or browse"
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: PDF (with OCR fallback for scans), DOCX, TXT (Max 15MB)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Dengue Clinical Management SOP"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition"
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
            className="w-full py-3 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center justify-center space-x-2 transition shadow-sm"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading & Starting Ingestion Pipeline...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Index Document</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Uploaded Documents</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {processingCount > 0
                ? `⚡ ${processingCount} document(s) currently being processed and vectorized...`
                : "All documents up to date."}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Document Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Chunks</th>
                <th className="px-6 py-4">Uploaded</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading documents...</span>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>No clinical documents uploaded yet. Upload a SOP above to get started.</span>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs uppercase">
                          {doc.fileType || "doc"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{doc.title}</p>
                          <p className="text-xs text-slate-400">{doc.originalFilename}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {doc.category || "General"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {doc.status === "indexed" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Indexed</span>
                        </span>
                      )}
                      {doc.status === "processing" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>Processing OCR & Vectors</span>
                        </span>
                      )}
                      {doc.status === "failed" && (
                        <button
                          onClick={() => setViewErrorDoc(doc)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition"
                          title="Click to view error reason"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Failed (View Error)</span>
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      {doc.chunkCount || 0}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteModalDoc(doc)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Document Ingestion Failed</h3>
              </div>
              <button
                onClick={() => setViewErrorDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Document</span>
                <p className="font-bold text-slate-800">{viewErrorDoc.title}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Error Details</span>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-mono text-xs mt-1">
                  {viewErrorDoc.errorMessage || "Unknown ingestion pipeline error"}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewErrorDoc(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Clinic Document?</h3>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteModalDoc.title}"</span>?
                This will permanently remove the document from MongoDB, Cloudinary, and purge all its vector chunks from Qdrant.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteModalDoc(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-sm"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
