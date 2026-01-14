"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  const [role, setRole] = React.useState("admin"); // default role
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({
        ...form,
        role, // Kirim role ke backend
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Terjadi kesalahan saat login. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-6 relative overflow-hidden">

      {/* Form Login */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md z-10">
        {/* Logo & Title */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mr-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AttendTrack</h1>
        </div>

        <p className="text-center text-gray-800 font-semibold mb-2">Welcome Back</p>
        <p className="text-center text-gray-600 text-sm mb-8">
          Sign in to access your attendance dashboard
        </p>

        {/* Pilih Role */}
        <div className="mb-8">
          <p className="text-center text-gray-700 text-sm font-medium mb-4">Login As</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`py-6 px-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 shadow-md ${role === "admin"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xl scale-105"
                  : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                }`}
            >
              <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">👔</span>
              </div>
              <span className="font-semibold">Admin / HR</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("karyawan")}
              className={`py-6 px-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3 shadow-md ${role === "karyawan"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xl scale-105"
                  : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                }`}
            >
              <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">👤</span>
              </div>
              <span className="font-semibold">Karyawan</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-600 bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-8">
            <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-600 bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          {/* Remember me & Forgot */}
          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
              <span className="ml-3 text-sm text-gray-700">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}