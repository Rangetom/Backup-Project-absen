"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, ChevronRight, Calendar } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();

  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Terjadi kesalahan saat login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob bg-blue-400"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 bg-cyan-400"></div>

      {/* Compact Login Card */}
      <div className="w-full max-w-[440px] z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">

          {/* Compact Header */}
          <div className="p-8 pb-5 bg-blue-600">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <div className="bg-white p-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <h1 className="text-lg font-black text-white tracking-tight uppercase">AttendTrack</h1>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              Selamat Datang.
            </h2>
            <p className="text-white/70 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">
              Akses Dashboard Anda
            </p>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black flex items-center gap-2.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] ml-3">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors group-focus-within:text-blue-500 text-slate-300" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="nama@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-slate-100 focus:bg-white transition-all font-bold text-xs text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] ml-3">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors group-focus-within:text-blue-500 text-slate-300" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-slate-100 focus:bg-white transition-all font-bold text-xs text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-white transition-all duration-500 active:scale-95 disabled:opacity-70 mt-4 shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}