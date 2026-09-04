"use client";

/**
 * ============================================================================
 * Receptionist Workspace — MedFlowAI Patient Intake & Directory
 * ============================================================================
 * Redesigned with Linear / Stripe SaaS aesthetics:
 * - Refined Triage & Demographics intake card
 * - Vitals input groups with unit badges & clinical iconography
 * - High-density, searchable patient directory table with status badges
 * - Polished modal dialog with backdrop blur for record updates
 * ============================================================================
 */

import { useState, useEffect } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  UserPlus,
  Search,
  Users,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  HeartPulse,
  Activity,
  Thermometer,
  Droplet,
  X,
  Save,
  Clock,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ModalOverlay from "@/components/ModalOverlay";

export default function ReceptionistPage() {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Patient Registration Form State (matches PatientController fields exactly)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    contactNumber: "",
    address: "",
    diagnosis: "General Checkup / Triage",
    bp: "120/80 mmHg",
    pulse: 76,
    temp: "98.6°F",
    spo2: "99%",
  });

  // Edit Patient Modal State
  const [editingPatient, setEditingPatient] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  useScrollLock(!!editingPatient);

  // Fetch / Search patients
  const fetchPatients = async (query = "") => {
    setIsLoadingPatients(true);
    try {
      const url = query
        ? `/api/patients/search?query=${encodeURIComponent(query)}`
        : `/api/patients/search`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setPatients(data.results);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch patients:", err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients("");
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPatients(searchQuery);
  };

  // Handle new patient registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.gender) {
      setFeedback({ type: "error", message: "Name, age, and gender are required." });
      return;
    }

    setIsRegistering(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        contactNumber: formData.contactNumber.trim(),
        address: formData.address.trim(),
        diagnosis: formData.diagnosis.trim(),
        vitals: {
          bp: formData.bp,
          pulse: Number(formData.pulse) || 75,
          temp: formData.temp,
          spo2: formData.spo2,
        },
      };

      const res = await fetch("/api/receptionist/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to register patient");
      }

      setFeedback({
        type: "success",
        message: `Patient ${data.patient.name} (${data.patient.patientId || data.patient.id}) registered successfully!`,
      });

      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "Male",
        contactNumber: "",
        address: "",
        diagnosis: "General Checkup / Triage",
        bp: "120/80 mmHg",
        pulse: 76,
        temp: "98.6°F",
        spo2: "99%",
      });

      fetchPatients(searchQuery);
    } catch (err) {
      console.error("Registration error:", err);
      setFeedback({ type: "error", message: err.message || "Error registering patient." });
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle patient info update
  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/receptionist/patients/${editingPatient._id || editingPatient.patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editingPatient.name,
          age: Number(editingPatient.age),
          gender: editingPatient.gender,
          contactNumber: editingPatient.contactNumber,
          address: editingPatient.address,
          diagnosis: editingPatient.diagnosis,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update patient");
      }

      setFeedback({
        type: "success",
        message: `Patient ${editingPatient.name} records updated successfully.`,
      });

      setEditingPatient(null);
      fetchPatients(searchQuery);
    } catch (err) {
      console.error("Update error:", err);
      setFeedback({ type: "error", message: err.message || "Failed to update patient." });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["receptionist", "admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Banner & Quick Metrics */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Reception Desk & Clinical Triage
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-600" />
              Patient Intake & Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Onboard incoming patients for clinical consultation, record initial vitals, and maintain up-to-date registry records.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>HIPAA Compliant Ingestion</span>
            </div>
            <button
              onClick={() => fetchPatients(searchQuery)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 active:scale-[0.98] transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPatients ? "animate-spin text-emerald-600" : "text-slate-500"}`} />
              <span>Refresh Directory</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {feedback.message && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center space-x-3 border transition-all animate-in fade-in slide-in-from-top-2 ${
              feedback.type === "success"
                ? "bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-xs"
                : "bg-rose-50/90 text-rose-800 border-rose-200 shadow-xs"
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
              className="text-xs font-semibold px-2 py-1 rounded hover:bg-black/5 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid: Left = Register Form, Right = Patient Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form: Register Patient */}
          <div className="lg:col-span-5 card-modern overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">New Patient Registration</h2>
                  <p className="text-[11px] text-slate-500">Record demographics and initial clinical triage</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Step 1 of 2
              </span>
            </div>

            <form onSubmit={handleRegister} className="p-5 space-y-4 text-xs sm:text-sm flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Zafar Iqbal"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 38"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Phone & Address */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        placeholder="+92 300 1234567"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Address / City
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Block 6, Karachi"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Chief Complaint / Triage Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Chief Complaint / Triage Reason
                  </label>
                  <input
                    type="text"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    placeholder="e.g. Acute high fever with headache & rash"
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Triage Vitals Section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2.5">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 tracking-tight">Triage Recorded Vitals</span>
                    <span className="text-[10px] text-slate-400 font-medium">(Syncs to Digital Twin)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* BP */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        <span>BP</span>
                        <Activity className="w-3 h-3 text-rose-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.bp}
                        onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                        placeholder="120/80"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Pulse */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        <span>Pulse</span>
                        <HeartPulse className="w-3 h-3 text-red-500" />
                      </div>
                      <input
                        type="number"
                        value={formData.pulse}
                        onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                        placeholder="76"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Temp */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        <span>Temp</span>
                        <Thermometer className="w-3 h-3 text-amber-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.temp}
                        onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                        placeholder="98.6°F"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* SpO2 */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        <span>SpO2</span>
                        <Droplet className="w-3 h-3 text-sky-500" />
                      </div>
                      <input
                        type="text"
                        value={formData.spo2}
                        onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                        placeholder="99%"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full mt-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition shadow-sm hover:shadow"
              >
                {isRegistering ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isRegistering ? "Registering Patient..." : "Complete Patient Intake"}</span>
              </button>
            </form>
          </div>

          {/* Directory: Search & Patient List */}
          <div className="lg:col-span-7 card-modern overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-clinic-100 text-clinic-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Patient Directory</h2>
                  <p className="text-[11px] text-slate-500">Live roster of patients registered in the clinical system</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold self-start sm:self-auto">
                <span>Total Roster:</span>
                <span className="text-emerald-700 font-bold">{patients.length}</span>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, Patient ID (PAT-xxxx), or diagnosis..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-xs hover:shadow active:scale-[0.98]"
                >
                  Search
                </button>
              </form>

              {/* Patient Card List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {isLoadingPatients && patients.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs font-medium">Syncing patient roster...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">No patient records found</p>
                    <p className="text-xs text-slate-400 mt-1">Use the intake form to register a new incoming patient.</p>
                  </div>
                ) : (
                  patients.map((pat, index) => {
                    const initials = (pat.name || "PT")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const avatarColors = [
                      "from-emerald-500 to-teal-600",
                      "from-blue-500 to-indigo-600",
                      "from-violet-500 to-purple-600",
                      "from-rose-500 to-pink-600",
                      "from-amber-500 to-orange-600",
                      "from-cyan-500 to-sky-600",
                    ];
                    const colorClass = avatarColors[index % avatarColors.length];

                    const genderBadge =
                      pat.gender === "Female"
                        ? "bg-pink-50 text-pink-700 border-pink-200"
                        : pat.gender === "Other"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-sky-50 text-sky-700 border-sky-200";

                    const registeredTime = pat.createdAt
                      ? (() => {
                          const d = new Date(pat.createdAt);
                          const today = new Date();
                          const isToday = d.toDateString() === today.toDateString();
                          const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                          return isToday
                            ? `Today · ${time}`
                            : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
                        })()
                      : "Recently";

                    return (
                      <div
                        key={pat._id || pat.patientId}
                        className="group flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-sm transition-all duration-200 cursor-default"
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          {initials}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-800 transition truncate">
                              {pat.name}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md flex-shrink-0">
                              {pat.patientId || pat.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Age + Gender */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${genderBadge}`}>
                              {pat.age}y · {pat.gender}
                            </span>

                            {/* Diagnosis */}
                            {pat.diagnosis && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 max-w-[160px] truncate">
                                <Stethoscope className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
                                <span className="truncate">{pat.diagnosis}</span>
                              </span>
                            )}

                            {/* Phone */}
                            {pat.contactNumber && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <Phone className="w-2.5 h-2.5" />
                                {pat.contactNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right side: time + action */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{registeredTime}</span>
                          </div>
                          <button
                            onClick={() => setEditingPatient(pat)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold border border-slate-200 hover:border-emerald-300 transition opacity-0 group-hover:opacity-100"
                            title="Edit Patient"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Patient Modal */}
        {editingPatient && (
          <ModalOverlay>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Edit Patient Details</h3>
                    <p className="text-[11px] text-slate-500">Update demographic or triage records</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingPatient(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdatePatient} className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.name}
                    onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">Age</label>
                    <input
                      type="number"
                      value={editingPatient.age}
                      onChange={(e) => setEditingPatient({ ...editingPatient, age: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">Gender</label>
                    <select
                      value={editingPatient.gender}
                      onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingPatient.contactNumber || ""}
                    onChange={(e) => setEditingPatient({ ...editingPatient, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={editingPatient.address || ""}
                    onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">Triage Reason / Diagnosis</label>
                  <input
                    type="text"
                    value={editingPatient.diagnosis || ""}
                    onChange={(e) => setEditingPatient({ ...editingPatient, diagnosis: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingPatient(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-xs active:scale-[0.98]"
                  >
                    {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Record</span>
                  </button>
                </div>
              </form>
            </div>
          </ModalOverlay>
        )}
      </div>
    </AuthGuard>
  );
}
