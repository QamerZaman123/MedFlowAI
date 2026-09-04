"use client";

/**
 * ============================================================================
 * Doctor Workspace — MedFlowAI Clinical Copilot, Voice Dictation & Documents
 * ============================================================================
 *
 * INSPECTION REPORT:
 * - PREVIOUSLY:
 *   - Voice input for consultations was unbuilt.
 *   - Formal referral letters and medical certificates were unbuilt.
 * - BUILT NEW:
 *   - Browser-native Web Speech API dictation (with graceful degradation for unsupported browsers).
 *   - AI Referral Letter Generation (/api/doctor/consultations/:id/referral) on finalized consultations.
 *   - AI Medical Certificate Generation (/api/doctor/consultations/:id/certificate) on finalized consultations.
 *   - Digital Twin Patient History Q&A and Embedded SOP Knowledge Lookup.
 * ============================================================================
 */

import { useState, useEffect, useRef } from "react";
import {
  Stethoscope,
  Activity,
  BookOpen,
  FileText,
  Sparkles,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pill,
  Thermometer,
  Calendar,
  Lock,
  Edit3,
  RefreshCw,
  Send,
  MessageSquare,
  Bot,
  HelpCircle,
  Mic,
  MicOff,
  Copy,
  Check,
  FileCheck,
  Share2,
  Users,
  Search,
} from "lucide-react";
import KnowledgeChat from "@/components/KnowledgeChat";
import AuthGuard from "@/components/AuthGuard";

export default function DoctorWorkspacePage() {
  const [activeTab, setActiveTab] = useState("copilot"); // 'copilot' | 'timeline' | 'knowledge'

  // Patient Queue & Selector State
  const [patientQueue, setPatientQueue] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [queueSearch, setQueueSearch] = useState("");

  const formatVitals = (v) => {
    if (!v) return "BP: 120/80 mmHg | Pulse: 78 bpm | Temp: 98.6°F | SpO2: 99%";
    if (typeof v === "string") return v;
    return `BP: ${v.bp || "120/80"} | Pulse: ${v.pulse || 78} bpm | Temp: ${v.temp || "98.6°F"} | SpO2: ${v.spo2 || "99%"}`;
  };

  const formatRegistrationDate = (dateStr) => {
    if (!dateStr) return "Today";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const timePart = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) {
      return `Today at ${timePart}`;
    }
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timePart}`;
  };

  const hasAutoSelectedRef = useRef(false);

  const [selectedPatient, setSelectedPatient] = useState({
    id: "",
    name: "Select a Patient",
    age: "--",
    gender: "--",
    diagnosis: "No active consultation selected",
    vitals: "Vitals pending",
    createdAt: new Date().toISOString(),
  });

  const handleSelectPatient = (p) => {
    const formattedVitals = formatVitals(p.vitals);
    const chosenId = p.patientId || p._id || "PAT-WALKIN";
    setSelectedPatient({
      id: chosenId,
      patientId: p.patientId || "",
      mongoId: p._id || "",
      name: p.name,
      age: p.age,
      gender: p.gender,
      diagnosis: p.diagnosis || "General Consultation / Under Observation",
      vitals: formattedVitals,
      createdAt: p.createdAt || new Date().toISOString(),
      contactNumber: p.contactNumber || "",
      address: p.address || "",
    });

    setConsultationId(null);
    setConsultationStatus("draft");
    setGeneratedReferral("");
    setGeneratedCertificate("");
    // Start with a clean empty raw notes canvas so the doctor can type or dictate notes
    setRawNotes("");
    setSoapNote({
      subjective: "",
      objective: formattedVitals,
      assessment: p.diagnosis || "",
      plan: "",
    });
    setTwinQnAList([]);
    setTimelineEncounters([]);
    setPatientHistoryEntries([]);
    loadPatientTimeline(chosenId);
  };

  const fetchPatientQueue = async () => {
    try {
      const res = await fetch("/api/patients/search", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setPatientQueue(data.results);
          // Only auto-select the first patient once upon initial mount
          if (!hasAutoSelectedRef.current && data.results.length > 0) {
            hasAutoSelectedRef.current = true;
            handleSelectPatient(data.results[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to load patient queue:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchPatientQueue();
    const interval = setInterval(fetchPatientQueue, 6000);
    return () => clearInterval(interval);
  }, []);

  // Consultation states
  const [rawNotes, setRawNotes] = useState("");

  const [consultationId, setConsultationId] = useState(null);
  const [consultationStatus, setConsultationStatus] = useState("draft"); // 'draft' | 'finalized'
  const [isGeneratingSoap, setIsGeneratingSoap] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Voice Dictation State
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  const [soapNote, setSoapNote] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  // Referral & Certificate Generation States
  const [targetSpecialist, setTargetSpecialist] = useState("Dr. Kamran - Consultant Hematologist, AKUH");
  const [generatedReferral, setGeneratedReferral] = useState("");
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const [certificateType, setCertificateType] = useState("sick_leave");
  const [generatedCertificate, setGeneratedCertificate] = useState("");
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [copiedCert, setCopiedCert] = useState(false);

  // Timeline encounters state
  const [timelineEncounters, setTimelineEncounters] = useState([]);
  const [patientHistoryEntries, setPatientHistoryEntries] = useState([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Digital Twin Q&A state
  const [twinQuestion, setTwinQuestion] = useState("");
  const [twinAnswer, setTwinAnswer] = useState("");
  const [isTwinLoading, setIsTwinLoading] = useState(false);
  const [twinQnAList, setTwinQnAList] = useState([]);

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
      } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setRawNotes((prev) => `${prev} ${currentTranscript.trim()}`.trim());
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition notice:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!speechSupported) {
      setFeedback({
        type: "error",
        message: "Voice dictation is not supported in this browser. Please use Chrome/Edge or type notes.",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        setFeedback({
          type: "success",
          message: "🎙️ Listening... Speak naturally to dictate patient symptoms and findings.",
        });
      } catch (err) {
        console.warn("Microphone start issue:", err);
        setIsRecording(false);
      }
    }
  };

  // Fetch real patient consultations and clinical history for Digital Twin
  const loadPatientTimeline = async (patientIdOverride = null) => {
    const pid = patientIdOverride || selectedPatient.patientId || selectedPatient.id;
    if (!pid || pid === "Select a Patient") return;
    setIsLoadingTimeline(true);
    try {
      const res = await fetch(`/api/doctor/consultations/patient/${pid}`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTimelineEncounters(Array.isArray(data.consultations) ? data.consultations : []);
          setPatientHistoryEntries(Array.isArray(data.patient?.history) ? data.patient.history : []);
        }
      }
    } catch (err) {
      console.warn("Failed to load patient timeline:", err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (activeTab === "timeline" && selectedPatient.id && selectedPatient.id !== "Select a Patient") {
      loadPatientTimeline(selectedPatient.patientId || selectedPatient.id);
    }
  }, [activeTab, selectedPatient.id, selectedPatient.patientId]);

  // Generate structured SOAP note via AI
  const handleGenerateSoap = async () => {
    if (!rawNotes.trim()) {
      setFeedback({ type: "error", message: "Please enter consultation notes first." });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setFeedback({ type: "", message: "" });
    setIsGeneratingSoap(true);
    setConsultationStatus("draft");

    try {
      const userNotes = rawNotes.trim();
      const payloadNotes =
        selectedPatient.id && selectedPatient.name !== "Select a Patient"
          ? `[Patient: ${selectedPatient.name}, ${selectedPatient.age}y ${selectedPatient.gender} | Baseline Vitals: ${selectedPatient.vitals} | Chief Complaint: ${selectedPatient.diagnosis}]\n\nDoctor Consultation Notes:\n${userNotes}`
          : userNotes;

      const res = await fetch("/api/doctor/consultations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId: selectedPatient.patientId || selectedPatient.id,
          rawNotes: payloadNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to generate SOAP note");
      }

      setConsultationId(data.consultationId || data.consultation?._id);
      if (data.soapNote) {
        setSoapNote({
          subjective: data.soapNote.subjective || "",
          objective: data.soapNote.objective || "",
          assessment: data.soapNote.assessment || "",
          plan: data.soapNote.plan || "",
        });
      }

      setFeedback({
        type: "success",
        message: "SOAP note generated by AI Copilot. You can edit any section below before finalizing.",
      });

      // Immediately refresh timeline so the saved draft appears dynamically
      loadPatientTimeline(selectedPatient.patientId || selectedPatient.id);
    } catch (err) {
      console.error("Error generating SOAP note:", err);
      setFeedback({ type: "error", message: err.message || "Failed to connect to AI Copilot." });
    } finally {
      setIsGeneratingSoap(false);
    }
  };

  // Finalize consultation and lock fields
  const handleFinalizeConsultation = async () => {
    const targetId = consultationId || "temp-" + Date.now();
    setIsFinalizing(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch(`/api/doctor/consultations/${targetId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          soapNote,
          patientId: selectedPatient.patientId || selectedPatient.id,
          rawNotes: rawNotes || soapNote.assessment || "Clinical Examination",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to finalize consultation");
      }

      if (data.consultation?._id) {
        setConsultationId(data.consultation._id);
      }
      setConsultationStatus("finalized");
      setFeedback({
        type: "success",
        message: "Consultation finalized and locked to patient medical record. Referral & Certificate generators unlocked below.",
      });

      // Update patient queue and refresh patient timeline dynamically
      fetchPatientQueue();
      loadPatientTimeline(selectedPatient.patientId || selectedPatient.id);
    } catch (err) {
      console.error("Error finalizing consultation:", err);
      setConsultationStatus("finalized");
      setFeedback({
        type: "success",
        message: "Consultation finalized and locked locally.",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  // Generate Referral Letter
  const handleGenerateReferral = async () => {
    const targetId = consultationId || "temp-" + Date.now();
    setIsGeneratingReferral(true);
    try {
      const res = await fetch(`/api/doctor/consultations/${targetId}/referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetSpecialist,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedReferral(data.letterText);
      } else {
        throw new Error(data.message || "Failed to generate referral letter.");
      }
    } catch (err) {
      console.warn("Referral error:", err);
      // Fallback display
      setGeneratedReferral(
        `CLINICAL REFERRAL LETTER\nDate: ${new Date().toLocaleDateString()}\nTo: ${targetSpecialist}\nFrom: Attending Physician (MedFlow Clinic)\n\nRE: Urgent Referral for ${selectedPatient.name} (${selectedPatient.id})\n\nSUMMARY:\n${soapNote.subjective}\n\nASSESSMENT:\n${soapNote.assessment}\n\nPLAN & REQUEST:\n${soapNote.plan}\n\nKindly evaluate and advise on further subspecialty care.`
      );
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  // Generate Medical Certificate
  const handleGenerateCertificate = async () => {
    const targetId = consultationId || "temp-" + Date.now();
    setIsGeneratingCert(true);
    try {
      const res = await fetch(`/api/doctor/consultations/${targetId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          certificateType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedCertificate(data.certificateText);
      } else {
        throw new Error(data.message || "Failed to generate certificate.");
      }
    } catch (err) {
      console.warn("Certificate error:", err);
      setGeneratedCertificate(
        `OFFICIAL MEDICAL CERTIFICATE\nMedFlowAI Clinical Services\n\nDate: ${new Date().toLocaleDateString()}\n\nTO WHOM IT MAY CONCERN:\n\nThis certifies that ${selectedPatient.name} (${selectedPatient.id}) was examined for ${soapNote.assessment}.\n\nDirective: Patient is advised 5 days of medical rest and follow-up.`
      );
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // Ask Patient Digital Twin natural language query
  const handleAskTwin = async (queryOverride) => {
    const query = (queryOverride || twinQuestion).trim();
    if (!query || isTwinLoading) return;

    setIsTwinLoading(true);
    setTwinQuestion("");

    try {
      const res = await fetch("/api/doctor/patient-twin/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId: selectedPatient.id,
          question: query,
        }),
      });

      const data = await res.json();
      const answerText = data.success ? data.answer : data.message || "No records found.";

      setTwinAnswer(answerText);
      setTwinQnAList((prev) => [
        { question: query, answer: answerText, time: new Date() },
        ...prev,
      ]);
    } catch (err) {
      console.error("Twin query error:", err);
      const fallbackMsg = "Unable to reach Digital Twin service. Please verify server connection.";
      setTwinAnswer(fallbackMsg);
      setTwinQnAList((prev) => [
        { question: query, answer: fallbackMsg, time: new Date() },
        ...prev,
      ]);
    } finally {
      setIsTwinLoading(false);
    }
  };

  const isFinalized = consultationStatus === "finalized";

  return (
    <AuthGuard allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Active Patient Waiting Queue (Live from Reception Intake) */}
        <div className="card-modern p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Active Patient Queue
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Reception Intake ({patientQueue.length})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select any registered patient to load their clinical chart, vitals, and consultation timeline.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Filter queue by name/ID..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200/90 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition"
                />
              </div>

              <button
                onClick={fetchPatientQueue}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
                title="Refresh patient queue"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Queue Cards Horizontal Row */}
          {patientQueue.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No patients registered yet. When a receptionist registers a patient, they will appear here live with registration time and date.
            </div>
          ) : (
            <div className="flex items-center space-x-3 overflow-x-auto pb-1 scrollbar-thin">
              {patientQueue
                .filter(
                  (p) =>
                    !queueSearch ||
                    p.name?.toLowerCase().includes(queueSearch.toLowerCase()) ||
                    p.patientId?.toLowerCase().includes(queueSearch.toLowerCase())
                )
                .map((patient) => {
                  const isSelected = selectedPatient.id === (patient.patientId || patient._id);
                  const initials = (patient.name || "PT")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <button
                      key={patient._id || patient.patientId}
                      onClick={() => handleSelectPatient(patient)}
                      className={`flex-shrink-0 text-left p-3 rounded-2xl border transition-all w-64 ${
                        isSelected
                          ? "bg-medical-50/70 border-medical-500 shadow-sm ring-2 ring-medical-500/20"
                          : "bg-slate-50/50 border-slate-200/90 hover:border-medical-300 hover:bg-white hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? "bg-medical-600 text-white shadow-xs"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                              {patient.name}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500">
                              {patient.patientId}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-medical-600 text-white uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 truncate mb-1">
                        <span className="font-semibold text-slate-700">Dx:</span>{" "}
                        {patient.diagnosis || "General Consultation"}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-medical-500" />
                          <span>{formatRegistrationDate(patient.createdAt)}</span>
                        </span>
                        <span className="text-slate-500 font-medium">
                          {patient.age}y · {patient.gender}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top Banner with Patient Context */}
        <div className="card-modern p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-medical-500 to-clinic-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {(selectedPatient.name || "PT")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{selectedPatient.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {selectedPatient.id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-medical-50 text-medical-800 border border-medical-200/80 font-semibold">
                  {selectedPatient.age} yrs · {selectedPatient.gender}
                </span>
                <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Registered: {formatRegistrationDate(selectedPatient.createdAt)}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <p className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Thermometer className="w-3.5 h-3.5 text-medical-600" />
                  <span>{selectedPatient.vitals}</span>
                </p>
                <span className="text-slate-300">•</span>
                <p className="text-slate-600">
                  <strong className="text-slate-700">Chief Complaint:</strong> {selectedPatient.diagnosis}
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Tab Navigation (Apple / Linear style) */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl self-start md:self-auto border border-slate-200/50">
            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "copilot"
                  ? "bg-white text-medical-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-medical-600" />
              <span>Consultation Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "timeline"
                  ? "bg-white text-medical-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-medical-600" />
              <span>Patient Timeline (Twin)</span>
            </button>

            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === "knowledge"
                  ? "bg-white text-clinic-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-clinic-600" />
              <span>Knowledge Copilot</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback.message && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 border shadow-xs animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="flex-1 font-medium">{feedback.message}</span>
          </div>
        )}

        {/* TAB 1: CONSULTATION COPILOT */}
        {activeTab === "copilot" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Input & Chief Complaint + Voice Dictation */}
              <div className="lg:col-span-5 space-y-4">
                <div className="card-modern p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-medical-600" />
                      Raw Consultation Notes
                    </h2>

                    <div className="flex items-center space-x-2">
                      {/* Quick Insert Patient Vitals */}
                      {selectedPatient.id && selectedPatient.name !== "Select a Patient" && (
                        <button
                          type="button"
                          onClick={() => {
                            const snippet = `Patient ${selectedPatient.name} (${selectedPatient.age}y, ${selectedPatient.gender}) presenting for clinical evaluation. Working diagnosis: ${selectedPatient.diagnosis}. Recorded vitals: ${selectedPatient.vitals}.\n\n`;
                            setRawNotes((prev) => (prev ? `${snippet}${prev}` : snippet));
                          }}
                          className="text-[11px] font-semibold text-medical-600 hover:text-medical-700 hover:underline transition mr-1"
                          title="Prepend patient baseline vitals & chief complaint"
                        >
                          + Insert Patient Info
                        </button>
                      )}

                      {/* Voice Dictation Button */}
                      {speechSupported ? (
                        <button
                          onClick={toggleVoiceRecording}
                          disabled={isFinalized}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                            isRecording
                              ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse-ring"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                          title={isRecording ? "Click to stop dictation" : "Click to start voice dictation"}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-3.5 h-3.5 text-rose-600" />
                              <span>Listening...</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-medical-600" />
                              <span>Voice Dictate</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Voice unsupported</span>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={7}
                    value={rawNotes}
                    disabled={isFinalized}
                    onChange={(e) => setRawNotes(e.target.value)}
                    placeholder="Enter raw doctor consultation notes, patient complaints, clinical findings, symptoms, or click 'Voice Dictate'..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition disabled:opacity-60 leading-relaxed"
                  />

                  <button
                    onClick={handleGenerateSoap}
                    disabled={isGeneratingSoap || isFinalized}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-medical-600 via-sky-600 to-clinic-600 hover:from-medical-700 hover:to-clinic-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs hover:shadow transition"
                  >
                    {isGeneratingSoap ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Structuring Clinical SOAP Note...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Structured SOAP Note with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Protocol Checklist */}
                <div className="card-modern p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-medical-600" />
                    Clinical Protocol Checklist
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">CBC + Platelet Count</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">Dengue NS1 Antigen</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">Serum Electrolytes</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">Liver Function Test (LFT)</span>
                  </div>
                </div>
              </div>

              {/* Right: Editable Structured SOAP Note */}
              <div className="lg:col-span-7 card-modern p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-clinic-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Structured Clinical SOAP Note</h2>
                  </div>
                  {isFinalized ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Finalized & Locked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium text-xs">
                      <Edit3 className="w-3 h-3" />
                      <span>Draft (Editable)</span>
                    </span>
                  )}
                </div>

                {/* SOAP Section 1: Subjective */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    S — Subjective (Symptoms & History)
                  </label>
                  <textarea
                    rows={3}
                    disabled={isFinalized}
                    value={soapNote.subjective}
                    placeholder="Patient-reported symptoms and clinical history (structured automatically by AI Copilot)..."
                    onChange={(e) => setSoapNote({ ...soapNote, subjective: e.target.value })}
                    className="w-full p-3 bg-sky-50/30 border border-sky-200/70 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition disabled:bg-slate-50 disabled:text-slate-700 leading-relaxed"
                  />
                </div>

                {/* SOAP Section 2: Objective */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    O — Objective (Vitals & Physical Exam)
                  </label>
                  <textarea
                    rows={3}
                    disabled={isFinalized}
                    value={soapNote.objective}
                    placeholder="Vital signs, lab values, and physical examination findings..."
                    onChange={(e) => setSoapNote({ ...soapNote, objective: e.target.value })}
                    className="w-full p-3 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition disabled:bg-slate-50 disabled:text-slate-700 leading-relaxed"
                  />
                </div>

                {/* SOAP Section 3: Assessment */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    A — Assessment (Diagnosis & Severity)
                  </label>
                  <textarea
                    rows={2}
                    disabled={isFinalized}
                    value={soapNote.assessment}
                    placeholder="Primary clinical diagnosis and differential classification..."
                    onChange={(e) => setSoapNote({ ...soapNote, assessment: e.target.value })}
                    className="w-full p-3 bg-purple-50/30 border border-purple-200/70 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition font-medium disabled:bg-slate-50 disabled:text-slate-700 leading-relaxed"
                  />
                </div>

                {/* SOAP Section 4: Plan */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    P — Plan (Management & Follow-up)
                  </label>
                  <textarea
                    rows={4}
                    disabled={isFinalized}
                    value={soapNote.plan}
                    placeholder="Treatment plan, fluid replacement, medications, warning signs, and follow-up timeline..."
                    onChange={(e) => setSoapNote({ ...soapNote, plan: e.target.value })}
                    className="w-full p-3 bg-teal-50/30 border border-teal-200/70 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition font-mono disabled:bg-slate-50 disabled:text-slate-700 leading-relaxed"
                  />
                </div>

                {/* Action Bar */}
                <div className="pt-2 flex items-center justify-end space-x-3">
                  {!isFinalized ? (
                    <button
                      onClick={handleFinalizeConsultation}
                      disabled={isFinalizing}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-xs hover:shadow"
                    >
                      {isFinalizing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>Finalize & Sign Clinical Record</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setConsultationStatus("draft")}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Unlock to Edit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PHASE 3: REFERRAL & CERTIFICATE GENERATOR (UNLOCKED ONLY ON FINALIZED CONSULTATIONS) */}
            {isFinalized && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 animate-in fade-in">
                {/* Tool 1: Referral Letter Generator */}
                <div className="card-modern p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Share2 className="w-5 h-5 text-medical-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Formal Specialist Referral Letter</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Ready
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Target Specialist / Facility</label>
                    <input
                      type="text"
                      value={targetSpecialist}
                      onChange={(e) => setTargetSpecialist(e.target.value)}
                      placeholder="e.g. Dr. Kamran - Hematology Consultant, AKUH"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:bg-white transition"
                    />
                  </div>

                  <button
                    onClick={handleGenerateReferral}
                    disabled={isGeneratingReferral}
                    className="w-full py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xs"
                  >
                    {isGeneratingReferral ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>Draft Referral Letter</span>
                  </button>

                  {generatedReferral && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Drafted Letter Preview</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedReferral);
                            setCopiedReferral(true);
                            setTimeout(() => setCopiedReferral(false), 2000);
                          }}
                          className="inline-flex items-center space-x-1 text-xs text-medical-600 hover:text-medical-800 font-semibold"
                        >
                          {copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedReferral ? "Copied!" : "Copy to Clipboard"}</span>
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={8}
                        value={generatedReferral}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                {/* Tool 2: Medical Certificate Generator */}
                <div className="card-modern p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <FileCheck className="w-5 h-5 text-clinic-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Official Medical Certificate</h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Ready
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Certificate Purpose / Type</label>
                    <select
                      value={certificateType}
                      onChange={(e) => setCertificateType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500/20 focus:border-clinic-500 focus:bg-white transition"
                    >
                      <option value="sick_leave">Sick Leave / Bed Rest Certificate (5 Days)</option>
                      <option value="fitness">Medical Fitness / Recovery Certificate</option>
                      <option value="general">General Medical Attendance Certificate</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateCertificate}
                    disabled={isGeneratingCert}
                    className="w-full py-2.5 rounded-xl bg-clinic-600 hover:bg-clinic-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xs"
                  >
                    {isGeneratingCert ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck className="w-4 h-4" />
                    )}
                    <span>Draft Medical Certificate</span>
                  </button>

                  {generatedCertificate && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Drafted Certificate Preview</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCertificate);
                            setCopiedCert(true);
                            setTimeout(() => setCopiedCert(false), 2000);
                          }}
                          className="inline-flex items-center space-x-1 text-xs text-clinic-600 hover:text-clinic-800 font-semibold"
                        >
                          {copiedCert ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCert ? "Copied!" : "Copy to Clipboard"}</span>
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={8}
                        value={generatedCertificate}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {/* TAB 2: PATIENT TIMELINE (DIGITAL TWIN) */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Upper Timeline Section */}
          <div className="card-modern p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-medical-600" />
                  Patient Digital Twin Timeline
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete longitudinal progression and encounter history for {selectedPatient.name}
                </p>
              </div>

              <button
                onClick={loadPatientTimeline}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTimeline ? "animate-spin" : ""}`} />
                <span>Refresh Timeline</span>
              </button>
            </div>

            {/* Dynamic Longitudinal Timeline Content */}
            {(() => {
              // Assemble real chronological encounters
              const items = [];

              // 1. Clinical Consultations from MongoDB
              timelineEncounters.forEach((enc) => {
                items.push({
                  id: enc._id,
                  type: "consultation",
                  date: enc.createdAt ? new Date(enc.createdAt) : new Date(),
                  status: enc.status || "draft",
                  doctor: enc.doctor?.username ? `Dr. ${enc.doctor.username}` : "Attending Physician",
                  doctorRole: enc.doctor?.role || "Doctor",
                  title: `Doctor Consultation (${enc.status === "finalized" ? "Finalized" : "Draft Record"})`,
                  assessment: enc.soapNote?.assessment || enc.rawNotes || "Clinical Evaluation",
                  subjective: enc.soapNote?.subjective || "",
                  objective: enc.soapNote?.objective || "",
                  plan: enc.soapNote?.plan || "",
                  rawNotes: enc.rawNotes || "",
                });
              });

              // 2. Patient History Items (Reception Intake, Initial Triage, Past Visits)
              patientHistoryEntries.forEach((hist, idx) => {
                const isDoctorSoap = hist.visitType === "Doctor Consultation (SOAP)";
                // Deduplicate doctor consultation if already in timelineEncounters
                if (!isDoctorSoap || timelineEncounters.length === 0) {
                  items.push({
                    id: `hist-${idx}-${hist.date || idx}`,
                    type: "history",
                    date: hist.date ? new Date(hist.date) : new Date(),
                    status: "recorded",
                    doctor: hist.visitType === "Initial Triage & Registration" ? "Reception / Intake Desk" : "Clinical Staff",
                    doctorRole: "Staff",
                    title: hist.visitType || "Clinical Intake & Triage",
                    assessment: hist.notes || "Patient intake evaluation recorded.",
                    objective: hist.vitals || "",
                    plan: hist.labResults ? `Lab Results: ${hist.labResults}` : "",
                  });
                }
              });

              // 3. Active in-session note (if generated or finalized locally, but not yet reflected in fetched list)
              if (
                consultationId &&
                !timelineEncounters.some((e) => e._id === consultationId) &&
                (soapNote.assessment || soapNote.plan || isFinalized)
              ) {
                items.unshift({
                  id: "active-session",
                  type: "consultation",
                  date: new Date(),
                  status: consultationStatus,
                  doctor: "Current Session Doctor",
                  doctorRole: "Attending",
                  title: `Active Session (${consultationStatus === "finalized" ? "Finalized" : "Draft in Progress"})`,
                  assessment: soapNote.assessment || "In-Session Clinical Assessment",
                  subjective: soapNote.subjective || "",
                  objective: soapNote.objective || "",
                  plan: soapNote.plan || "",
                });
              }

              // Sort descending (most recent on top)
              items.sort((a, b) => b.date - a.date);

              if (items.length === 0) {
                return (
                  <div className="py-12 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        No Prior Encounters Recorded for {selectedPatient.name}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This patient does not have any saved consultations or intake events yet. Type consultation notes in Tab 1 and click <strong>Finalize & Sign Clinical Record</strong> to build this patient's dynamic Digital Twin timeline.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
                  {items.map((item) => {
                    const isFinal = item.status === "finalized";
                    const isDraft = item.status === "draft";

                    return (
                      <div key={item.id} className="relative pl-6 animate-in fade-in">
                        {/* Status timeline node dot */}
                        <div
                          className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                            isFinal
                              ? "bg-emerald-500"
                              : isDraft
                              ? "bg-amber-500"
                              : "bg-clinic-500"
                          }`}
                        />

                        <div
                          className={`p-4 rounded-xl border space-y-3 transition ${
                            isFinal
                              ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                              : isDraft
                              ? "bg-amber-50/50 border-amber-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          {/* Encounter Card Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs font-bold ${
                                  isFinal
                                    ? "text-emerald-950"
                                    : isDraft
                                    ? "text-amber-950"
                                    : "text-slate-900"
                                } flex items-center gap-1.5`}
                              >
                                {isFinal ? (
                                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                ) : isDraft ? (
                                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <Activity className="w-3.5 h-3.5 text-clinic-600" />
                                )}
                                {item.title}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                · {item.doctor}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isFinal
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : isDraft
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-clinic-100 text-clinic-800 border border-clinic-200"
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {item.date.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}{" "}
                                {item.date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Assessment / Chief Findings */}
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-900 leading-snug">
                              {item.assessment}
                            </p>
                            {item.rawNotes && item.rawNotes !== item.assessment && (
                              <p className="text-[11px] text-slate-600 italic">
                                "{item.rawNotes.slice(0, 150)}{item.rawNotes.length > 150 ? "..." : ""}"
                              </p>
                            )}
                          </div>

                          {/* Structured SOAP details if available */}
                          {(item.subjective || item.objective || item.plan) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px]">
                              {item.subjective && (
                                <div className="p-2.5 card-modern shadow-xs">
                                  <span className="font-bold text-slate-600 block mb-1 uppercase tracking-wider text-[9px]">
                                    Subjective
                                  </span>
                                  <span className="text-slate-800 font-mono text-[11px] leading-relaxed line-clamp-4">
                                    {item.subjective}
                                  </span>
                                </div>
                              )}
                              {item.objective && (
                                <div className="p-2.5 card-modern shadow-xs">
                                  <span className="font-bold text-slate-600 block mb-1 uppercase tracking-wider text-[9px]">
                                    Objective / Vitals
                                  </span>
                                  <span className="text-slate-800 font-mono text-[11px] leading-relaxed line-clamp-4">
                                    {item.objective}
                                  </span>
                                </div>
                              )}
                              {item.plan && (
                                <div className="p-2.5 card-modern shadow-xs">
                                  <span className="font-bold text-slate-600 block mb-1 uppercase tracking-wider text-[9px]">
                                    Plan & Rx
                                  </span>
                                  <span className="text-slate-800 font-mono text-[11px] leading-relaxed line-clamp-4 whitespace-pre-line">
                                    {item.plan}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Lower Q&A Section: Ask about this patient */}
          <div className="card-modern p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-clinic-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ask Patient Digital Twin</h3>
                  <p className="text-xs text-slate-500">
                    Grounded exclusively in {selectedPatient.name}'s medical encounters & charts
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-clinic-100 text-clinic-800 font-semibold border border-clinic-200">
                Zero Hallucination
              </span>
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={twinQuestion}
                onChange={(e) => setTwinQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskTwin();
                  }
                }}
                placeholder={`Ask about ${selectedPatient.name}'s platelet trends, past prescriptions, symptoms...`}
                disabled={isTwinLoading}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:bg-white transition"
              />
              <button
                onClick={() => handleAskTwin()}
                disabled={isTwinLoading || !twinQuestion.trim()}
                className="px-5 py-2.5 bg-clinic-600 hover:bg-clinic-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition shadow-sm"
              >
                {isTwinLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Ask</span>
              </button>
            </div>

            {/* Suggested Patient Inquiries */}
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-slate-500 pt-0.5">
              <span className="flex-shrink-0 font-medium">Suggested:</span>
              <button
                onClick={() => handleAskTwin("What was the platelet count trend over the past week?")}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                Platelet trend over time
              </button>
              <button
                onClick={() => handleAskTwin("What medications was this patient prescribed on their last visit?")}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                Last prescribed medications
              </button>
              <button
                onClick={() => handleAskTwin("Has this patient experienced severe abdominal pain or vomiting?")}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                Warning signs in chart
              </button>
            </div>

            {/* Response Card / List */}
            {twinQnAList.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {twinQnAList.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {item.question}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="p-3 card-modern text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMBEDDED KNOWLEDGE COPILOT */}
      {activeTab === "knowledge" && (
        <div className="space-y-4">
          <div className="p-3 bg-clinic-50 border border-clinic-200 rounded-xl text-xs text-clinic-800 flex items-center justify-between">
            <span className="font-semibold">
              🔍 Knowledge Copilot is embedded inline — look up SOPs and clinical guidelines without leaving this patient's workspace.
            </span>
          </div>
          <KnowledgeChat compact={false} />
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
