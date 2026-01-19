"use client";

import { Mail, Lock, User, ChevronRight, LogIn } from "lucide-react";

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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Login Card */}
      <div className="w-full max-w-[480px] z-10">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden">

          {/* Header Section */}
          <div className="bg-blue-600 p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                  <div className="bg-white p-2 rounded-xl">
                    <LogIn className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight uppercase">AttendTrack</h1>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Selamat Datang<br />Kembali.
              </h2>
              <p className="text-blue-100 font-bold text-xs mt-3 uppercase tracking-widest opacity-80">
                Silakan login untuk akses dashboard
              </p>
            </div>
          </div>

          <div className="p-10 lg:p-12">
            {/* Role Selection */}
            <div className="mb-10">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4 text-center">Masuk Sebagai</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`group relative p-5 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${role === "admin"
                      ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200 scale-[1.02]"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200"
                    }`}
                >
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${role === "admin" ? "bg-blue-600 scale-110 shadow-lg shadow-blue-500/50" : "bg-white shadow-sm"
                      }`}>
                      <User className={`w-5 h-5 ${role === "admin" ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Admin / HR</span>
                  </div>
                  {role === "admin" && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole("karyawan")}
                  className={`group relative p-5 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${role === "karyawan"
                      ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200 scale-[1.02]"
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200"
                    }`}
                >
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${role === "karyawan" ? "bg-emerald-500 scale-110 shadow-lg shadow-emerald-500/50" : "bg-white shadow-sm"
                      }`}>
                      <User className={`w-5 h-5 ${role === "karyawan" ? "text-white" : "text-slate-400 group-hover:text-emerald-500"}`} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Karyawan</span>
                  </div>
                  {role === "karyawan" && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-[1.5rem] text-xs font-bold flex items-center gap-3 animate-shake">
                <div className="p-1.5 bg-rose-100 rounded-lg">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Email Address</label>
                <div className="group relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 transition-colors group-focus-within:bg-blue-50 rounded-xl">
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-blue-600/20 focus:bg-white/50 transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-bold"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Password</label>
                  <a href="#" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">Forgot?</a>
                </div>
                <div className="group relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 p-1.5 transition-colors group-focus-within:bg-blue-50 rounded-xl">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-blue-600/20 focus:bg-white/50 transition-all font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-bold"
                  />
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center px-2">
                <label className="flex items-center group cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-5 h-5 bg-slate-100 border-2 border-slate-100 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                    <svg className="absolute top-1 left-1 w-3 h-3 text-white scale-0 peer-checked:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="ml-3 text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Ingat Saya</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none mt-4 overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center mt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          &copy; 2026 attendtrack system • build v2.4.0
        </p>
      </div>
    </div>
  );
}