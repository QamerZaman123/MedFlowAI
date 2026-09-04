"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import ModalOverlay from "@/components/ModalOverlay";
import { useAuth } from "@/context/AuthContext";
import {
  UserPlus,
  Users,
  ShieldCheck,
  Activity,
  Search,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Calendar,
  Check,
  Stethoscope,
  Edit2,
  Trash2,
  KeyRound,
  AlertTriangle,
  Filter,
} from "lucide-react";

export default function AdminStaffPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Form State for creating new staff member
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "doctor",
  });

  // Edit Staff State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: "doctor",
    password: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Staff State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load staff roster.");
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setFeedback({ type: "error", message: err.message || "Failed to load staff roster." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      setFeedback({ type: "error", message: "All fields are required to provision a staff member." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create staff account.");
      }

      setFeedback({
        type: "success",
        message: `Successfully provisioned ${formData.role} account for ${formData.username} (${formData.email}).`,
      });

      // Reset form and close modal
      setFormData({ username: "", email: "", password: "", role: "doctor" });
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to create staff member." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (member) => {
    setEditingUser(member);
    setEditFormData({
      username: member.username || "",
      email: member.email || "",
      role: member.role || "doctor",
      password: "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editFormData.username || !editFormData.email || !editFormData.role) {
      setFeedback({ type: "error", message: "Username, email, and role are required." });
      return;
    }

    setIsUpdating(true);
    setFeedback({ type: "", message: "" });

    try {
      const payload = {
        username: editFormData.username.trim(),
        email: editFormData.email.trim().toLowerCase(),
        role: editFormData.role,
      };
      if (editFormData.password && editFormData.password.trim().length >= 6) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update staff member.");
      }

      setFeedback({
        type: "success",
        message: `Successfully updated ${payload.username} (${payload.email}).`,
      });

      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to update staff member." });
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteModal = (member) => {
    setDeletingUser(member);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch(`/api/admin/users/${deletingUser._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete staff member.");
      }

      setFeedback({
        type: "success",
        message: `Staff member ${deletingUser.username} (${deletingUser.email}) was removed.`,
      });

      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to delete staff member." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter staff list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "doctor":
        return {
          label: "Doctor",
          icon: Activity,
          badge: "bg-medical-50 text-medical-800 border-medical-200",
          dot: "bg-medical-500",
        };
      case "admin":
        return {
          label: "Admin",
          icon: ShieldCheck,
          badge: "bg-purple-50 text-purple-800 border-purple-200",
          dot: "bg-purple-500",
        };
      case "receptionist":
        return {
          label: "Receptionist",
          icon: Users,
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dot: "bg-emerald-500",
        };
      default:
        return {
          label: role,
          icon: User,
          badge: "bg-slate-50 text-slate-800 border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const doctorCount = users.filter((u) => u.role === "doctor").length;
  const receptionistCount = users.filter((u) => u.role === "receptionist").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header & Primary Action */}
        <div className="card-modern p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200/70 text-purple-700 text-xs font-semibold tracking-wide uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
              Clinic Administration & Access Control
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-purple-600" />
              Staff Management & Provisioning
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Provision clinician and front-desk accounts, modify access permissions, and maintain credential security across the hospital facility.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={fetchUsers}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs active:scale-[0.98]"
              title="Refresh staff roster"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision New Staff</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between space-x-3 transition-all animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-xs"
                : "bg-rose-50/90 text-rose-800 border-rose-200 shadow-xs"
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback({ type: "", message: "" })}
              className="text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="card-modern p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">{users.length}</span>
              <p className="text-[11px] text-slate-500 font-medium">Total Staff</p>
            </div>
          </div>

          <div className="card-modern p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-700 flex items-center justify-center font-bold border border-medical-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">{doctorCount}</span>
              <p className="text-[11px] text-slate-500 font-medium">Clinicians & Doctors</p>
            </div>
          </div>

          <div className="card-modern p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">{receptionistCount}</span>
              <p className="text-[11px] text-slate-500 font-medium">Reception & Intake</p>
            </div>
          </div>

          <div className="card-modern p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">{adminCount}</span>
              <p className="text-[11px] text-slate-500 font-medium">System Admins</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="card-modern p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by username or email..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            {[
              { id: "all", label: "All Roles" },
              { id: "doctor", label: "Doctors" },
              { id: "receptionist", label: "Receptionists" },
              { id: "admin", label: "Admins" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  roleFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Table */}
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Role & Access</th>
                  <th className="py-3.5 px-4">Contact Email</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Provisioned</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                      <span className="text-xs font-medium">Loading staff directory...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No staff members found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or role filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((member) => {
                    const roleInfo = getRoleBadge(member.role);
                    const RoleIcon = roleInfo.icon;
                    const isSelf = currentUser?.id === member._id || currentUser?.email === member.email;

                    return (
                      <tr key={member._id} className="hover:bg-slate-50/80 transition group">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100/70 text-purple-800 font-bold flex items-center justify-center text-xs uppercase flex-shrink-0">
                              {member.username ? member.username[0] : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-xs sm:text-sm group-hover:text-purple-700 transition">
                                {member.username}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {member._id.slice(-6)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${roleInfo.badge}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                          {member.email}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "System"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition shadow-2xs hover:border-purple-200"
                              title="Edit Staff Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isSelf ? (
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                                title="Active session account"
                              >
                                You
                              </span>
                            ) : (
                              <button
                                onClick={() => openDeleteModal(member)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition shadow-2xs hover:border-rose-200"
                                title="Delete Staff Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Provision Staff Member (CREATE) */}
        {isModalOpen && (
          <ModalOverlay className="animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Provision Staff Account</h2>
                    <p className="text-[11px] text-slate-500">Create access credentials for a clinician or staff member</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provisioning Form */}
              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs sm:text-sm">
                {/* Role Selector Cards */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Assign Clinical Role <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "doctor", name: "Doctor", icon: Activity, ring: "ring-2 ring-medical-500 bg-medical-50/70 border-medical-200" },
                      { id: "receptionist", name: "Receptionist", icon: Users, ring: "ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-200" },
                      { id: "admin", name: "Co-Admin", icon: ShieldCheck, ring: "ring-2 ring-purple-500 bg-purple-50/70 border-purple-200" },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = formData.role === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: opt.id })}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1.5 ${
                            isSelected
                              ? opt.ring + " font-bold text-slate-900"
                              : "border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Name / Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. DrKamran or ReceptionDesk2"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="staff@hospital.org"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Temporary Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white text-xs sm:text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Share this initial temporary password securely with the staff member.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Provision Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </ModalOverlay>
        )}

        {/* Modal: Edit Staff Member (UPDATE) */}
        {isEditModalOpen && editingUser && (
          <ModalOverlay className="animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Edit Staff Member</h2>
                    <p className="text-[11px] text-slate-500">Update role privileges, contact email, or password</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleUpdateStaff} className="space-y-4 text-xs sm:text-sm">
                {/* Role Selector Cards */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Clinical Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "doctor", name: "Doctor", icon: Activity, ring: "ring-2 ring-medical-500 bg-medical-50/70 border-medical-200" },
                      { id: "receptionist", name: "Receptionist", icon: Users, ring: "ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-200" },
                      { id: "admin", name: "Admin", icon: ShieldCheck, ring: "ring-2 ring-purple-500 bg-purple-50/70 border-purple-200" },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = editFormData.role === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, role: opt.id })}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1.5 ${
                            isSelected
                              ? opt.ring + " font-bold text-slate-900"
                              : "border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Name / Username</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={editFormData.username}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Optional Password Reset */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Reset Password</label>
                    <span className="text-[10px] text-slate-400">Leave blank to keep unchanged</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </ModalOverlay>
        )}

        {/* Modal: Delete Confirmation (DELETE) */}
        {isDeleteModalOpen && deletingUser && (
          <ModalOverlay className="animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Remove Staff Member</h3>
                  <p className="text-xs text-slate-500">Revoke hospital system credentials</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <p className="text-slate-600">Are you sure you want to permanently delete:</p>
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>{deletingUser.username}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    {deletingUser.role}
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">{deletingUser.email}</p>
              </div>

              <p className="text-xs text-rose-600 font-medium">
                This action cannot be undone. Active login sessions for this account will terminate immediately.
              </p>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteStaff}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70 active:scale-[0.98]"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </AuthGuard>
  );
}
