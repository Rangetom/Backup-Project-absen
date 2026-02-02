"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import useAuthMiddleware from "@/hooks/auth";
import Link from "next/link";
import AdminLayout from "@/components/Adminlayout";
import api from "@/utils/axios";
import Swal from "sweetalert2";
import Notification from "@/components/Notification";

export default function DashboardPage() {
  useAuthMiddleware();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success", // success | error
  });

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    companyId: "",
    status: "",
    role: "", // Add role filter
    period: "today", // Default to today
  });

  const fetchRecentAttendances = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append("search", appliedFilters.search);
      if (appliedFilters.companyId) params.append("company_id", appliedFilters.companyId);
      if (appliedFilters.status) params.append("status", appliedFilters.status);
      if (appliedFilters.role) params.append("role", appliedFilters.role);
      if (appliedFilters.period) params.append("period", appliedFilters.period);

      const res = await api.get(`/attendances?${params.toString()}`);
      // Filter out weekends (0 = Sunday, 6 = Saturday)
      const filteredData = res.data.filter(emp => {
        const day = new Date(emp.date).getDay();
        return day !== 0 && day !== 6;
      });
      setRecentAttendance(filteredData);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch recent attendances:", error);
      setError("Gagal memuat data absensi. Coba refresh halaman.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  useEffect(() => {
    fetchRecentAttendances();
    fetchCompanies();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchRecentAttendances();
  };

  const openPhotoModal = (attendance) => {
    console.log('Opening photo modal for:', attendance);
    console.log('Photo URL:', attendance.photo_url);
    setSelectedAttendance(attendance); // Simpan seluruh object attendance
  };

  const closePhotoModal = () => {
    setSelectedAttendance(null);
  };

  return (
    <AdminLayout>
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">
              Selamat datang kembali, <span className="text-blue-600">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem Online</span>
            </div>
          </div>
        </div>

        {/* Report Filters Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6 6a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707l-6-6A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Filter Data Kehadiran</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rentang Waktu</label>
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition appearance-none"
              >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="">Semua Waktu</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="HADIR">Hadir</option>
                <option value="TELAT">Telat</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Role</label>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition appearance-none"
              >
                <option value="">Semua Role</option>
                <option value="karyawan">Karyawan</option>
                <option value="magang">Magang</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Perusahaan</label>
              <select
                name="companyId"
                value={filters.companyId}
                onChange={handleFilterChange}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition appearance-none"
              >
                <option value="">Semua Cabang</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nama Karyawan</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Cari..."
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>
            <div className="flex items-end shadow-xl shadow-blue-100/50 rounded-2xl">
              <button
                onClick={applyFilters}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Terapkan
              </button>
            </div>
          </div>
        </div>

        {/* Recent Attendance Table Card */}
        <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Log Kehadiran</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Aktivitas presensi real-time karyawan</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sirkulasi Data: {recentAttendance.length} Entri</span>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="animate-spin w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Sinkronisasi Data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-3xl mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-900 font-black mb-1">Terjadi Kesalahan</p>
              <p className="text-slate-500 text-sm font-bold">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Informasi Karyawan</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-center">Role</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Penempatan</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-center">Waktu Log</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentAttendance.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-300">
                            {emp.user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-none mb-1">{emp.user.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{emp.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${emp.user.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : emp.user.role === 'magang' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {emp.user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{emp.user.company}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black tracking-widest border border-blue-100 mb-1">
                            {emp.check_in_time}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{emp.date}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${emp.status === 'HADIR'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                            {emp.status}
                          </span>
                          {emp.late_duration && (
                            <span className="text-[10px] font-bold text-orange-500 italic">
                              ({emp.late_duration})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => openPhotoModal(emp)}
                          className="p-2.5 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all active:scale-90 shadow-sm hover:shadow-md bg-white border border-slate-100"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recentAttendance.length === 0 && !loading && !error && (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-4xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Data Tidak Ditemukan</p>
            </div>
          )}
        </div>

        {/* Modal untuk View Foto Absen + Detail Lengkap */}
        {selectedAttendance && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-100 p-4" onClick={closePhotoModal}>
            <div className="bg-white rounded-4xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

              {/* Image Side */}
              <div className="w-full md:w-1/2 bg-slate-900 relative min-h-75 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedAttendance.photo_url}
                  alt="Foto Absensi"
                  className="w-full h-full object-cover opacity-90"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3Ctext fill="%23475569" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto Absensi Tidak Tersedia%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1 leading-none">Keamanan Data</p>
                  <p className="text-[10px] font-black text-white tracking-tight">Foto dienkripsi dengan Geo-tagging & Timestamp Verifikasi</p>
                </div>
              </div>

              {/* Info Side */}
              <div className="w-full md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="bg-blue-600 p-8 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">Verifikasi Detail</p>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">Detail Absensi</h3>
                  <button
                    onClick={closePhotoModal}
                    className="absolute top-6 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition active:scale-95 z-20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {/* User Profile Summary */}
                  <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-4xl border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
                      {selectedAttendance.user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{selectedAttendance.user.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedAttendance.user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">Penempatan: {selectedAttendance.user.company}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${selectedAttendance.user.role === 'magang' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>Role: {selectedAttendance.user.role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Check-in Log</p>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-lg font-black text-slate-900">{selectedAttendance.check_in_time}</span>
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Presensi</p>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${selectedAttendance.status === 'HADIR' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-lg font-black text-slate-900">{selectedAttendance.status === 'HADIR' ? 'Hadir' : 'Telat'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Late Duration (conditional) */}
                  {selectedAttendance.status === 'TELAT' && selectedAttendance.late_duration && (
                    <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100 animate-pulse">
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2">Durasi Terlambat</p>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-200 text-orange-700 rounded-xl">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-lg font-black text-orange-700">{selectedAttendance.late_duration}</span>
                      </div>
                    </div>
                  )}

                  {/* Location Info */}
                  <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Meta-Tag Lokasi (Lat, Lng)</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 leading-relaxed">{selectedAttendance.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={() => {
                        showNotification("Membuka foto di jendela baru...", "success");
                        // Opening in new tab is the most reliable way to save/download cross-origin images
                        window.open(selectedAttendance.photo_url, '_blank');
                      }}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Lihat foto
                    </button>
                    <button
                      onClick={closePhotoModal}
                      className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition active:scale-95"
                    >
                      Tutup Jendela Detail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
