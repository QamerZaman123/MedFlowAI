"use client";

/**
 * ============================================================================
 * Receptionist Workspace — MedFlowAI Patient Intake & Directory
 * ============================================================================
 *
 * INSPECTION REPORT:
 * - PREVIOUSLY: PatientController.js had endpoints for register, update, and search,
 *   but no frontend Receptionist dashboard existed.
 * - BUILT NEW: This Receptionist Workspace provides a complete patient onboarding
 *   form, real-time patient directory search, and an inline patient record editor.
 * ============================================================================
 */

import { useState, useEffect } from "react";
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
  X,
  Save,
} from "lucide-react";

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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Receptionist Intake & Patient Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register new patients for consultation, update contact records, and verify clinical triage
          </p>
        </div>

        <button
          onClick={() => fetchPatients(searchQuery)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingPatients ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </button>
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

      {/* Grid: Left = Register Form, Right = Patient Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Register Patient */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Patient Intake Registration</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Zafar Iqbal"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g. 38"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / City</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Block 6, PECHS, Karachi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chief Complaint / Triage Reason</label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g. Acute high fever with headache & rash"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Triage BP</label>
                <input
                  type="text"
                  value={formData.bp}
                  onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Triage Temp</label>
                <input
                  type="text"
                  value={formData.temp}
                  onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center space-x-2 transition shadow-sm"
            >
              {isRegistering ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Register Patient</span>
            </button>
          </form>
        </div>

        {/* Directory: Search & Patient List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-clinic-600" />
              Patient Directory ({patients.length})
            </h2>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, ID (e.g. PAT-892143), or diagnosis..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-clinic-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-clinic-600 hover:bg-clinic-700 text-white font-medium rounded-xl text-xs sm:text-sm transition shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Patient Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Triage / Diagnosis</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPatients && patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                      <span>Loading patients...</span>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <span>No patient records found. Register a new patient on the left.</span>
                    </td>
                  </tr>
                ) : (
                  patients.map((pat) => (
                    <tr key={pat._id || pat.patientId} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{pat.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">{pat.patientId || pat.id}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs">
                          {pat.age} yrs · {pat.gender}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1 text-slate-600 text-xs">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{pat.contactNumber || "N/A"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-medical-50 text-medical-800 border border-medical-200">
                          {pat.diagnosis || "Under Observation"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditingPatient(pat)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Patient Information"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Patient Details</h3>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePatient} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={editingPatient.age}
                    onChange={(e) => setEditingPatient({ ...editingPatient, age: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editingPatient.gender}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingPatient.contactNumber || ""}
                  onChange={(e) => setEditingPatient({ ...editingPatient, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editingPatient.address || ""}
                  onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diagnosis / Triage Reason</label>
                <input
                  type="text"
                  value={editingPatient.diagnosis || ""}
                  onChange={(e) => setEditingPatient({ ...editingPatient, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
