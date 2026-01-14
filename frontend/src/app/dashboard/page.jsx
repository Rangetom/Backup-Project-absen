"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import useAuthMiddleware from "@/hooks/auth";
import Link from "next/link";
import AdminLayout from "@/components/Adminlayout";
import api from "@/utils/axios";

export default function DashboardPage() {
  useAuthMiddleware();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    companyId: "",
    status: "",
    period: "today", // Default to today
  });

  const fetchRecentAttendances = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append("search", appliedFilters.search);
      if (appliedFilters.companyId) params.append("company_id", appliedFilters.companyId);
      if (appliedFilters.status) params.append("status", appliedFilters.status);
      if (appliedFilters.period) params.append("period", appliedFilters.period);

      const res = await api.get(`/attendances?${params.toString()}`);
      setRecentAttendance(res.data);
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
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-gray-500">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}</p>
        </div>

        {/* Report Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6 6a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707l-6-6A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800">Cari Data Absensi</h3>
          </div>
          <div className="text-black grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Rentang Waktu</label>
              <select
                name="period"
                value={filters.period}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none"
              >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="">Semua Waktu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="HADIR">Hadir</option>
                <option value="TELAT">Telat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Perusahaan</label>
              <select
                name="companyId"
                value={filters.companyId}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition appearance-none"
              >
                <option value="">Semua Perusahaan</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Cari Karyawan</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Nama karyawan..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Absensi Terbaru</h3>
              <p className="text-gray-500 text-xs">Daftar kehadiran karyawan hari ini</p>
            </div>
          </div>

          {loading && (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              Memuat data...
            </div>
          )}

          {error && <div className="p-8 text-center text-red-500 bg-red-50 m-4 rounded-xl">{error}</div>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest border-b">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Perusahaan</th>
                    <th className="px-6 py-4 text-center">Waktu/Tgl</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentAttendance.map((emp) => (
                    <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {emp.user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{emp.user.name}</p>
                            <p className="text-[10px] text-gray-500">ID: {emp.user.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-medium">{emp.user.company}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase mb-1">
                            {emp.check_in_time}
                          </span>
                          <span className="text-[10px] text-gray-400">{emp.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${emp.status === 'HADIR' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openPhotoModal(emp)}
                          className="bg-white border border-gray-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 p-2 rounded-lg transition-all shadow-sm active:scale-90 inline-flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Tidak ada data absensi hari ini</p>
            </div>
          )}
        </div>

        {/* Modal untuk View Foto Absen + Detail Lengkap */}
        {selectedAttendance && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closePhotoModal}>
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Detail Absensi</h3>
                <button onClick={closePhotoModal} className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl">
                    {selectedAttendance.user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800">{selectedAttendance.user.name}</h4>
                    <p className="text-gray-600">{selectedAttendance.user.email}</p>
                    <p className="text-sm text-gray-500">{selectedAttendance.user.code}</p>
                  </div>
                </div>
              </div>

              {/* Attendance Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Check-in Time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Check-in Time</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{selectedAttendance.check_in_time}</p>
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Status</span>
                  </div>
                  <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${selectedAttendance.status === 'HADIR' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                    {selectedAttendance.status === 'HADIR' ? 'Hadir' : 'Telat'}
                  </span>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Location</span>
                  </div>
                  <p className="text-sm text-gray-800">{selectedAttendance.location}</p>
                </div>
              </div>

              {/* Photo with Timestamp */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Foto Absensi dengan Timestamp
                </h4>
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={selectedAttendance.photo_url}
                    alt="Foto Absensi"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E';
                      e.target.nextElementSibling.innerText = `Failed source: ${selectedAttendance.photo_url}`;
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                </div>
                <p className="text-xs text-red-500 mt-2 text-center" style={{ display: 'none' }}>
                  Failed source: {selectedAttendance.photo_url}
                </p>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Foto ini sudah termasuk timestamp lokasi dan waktu absensi
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
