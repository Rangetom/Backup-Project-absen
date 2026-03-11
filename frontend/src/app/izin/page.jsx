"use client";

import AdminLayout from "@/components/Adminlayout";
import React, { useState, useEffect, useCallback } from "react";
import useAuthMiddleware from "@/hooks/auth";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/axios";
import Notification from "@/components/Notification";
import Swal from "sweetalert2";
import Image from "next/image";
import {
  Check,
  X,
  Eye,
  Info,
  AlertCircle,
  Clock,
  FileCheck2,
  Image as ImageIcon
} from 'lucide-react';


export default function AdminIzinPage() {
  useAuthMiddleware();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permits, setPermits] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });

  const fetchPermits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/attendances?status=IZIN");
      setPermits(res.data);
    } catch (err) {
      console.error("Failed to fetch permits:", err);
      showNotification("Gagal memuat data izin", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchPermits();
    }
  }, [currentUser, fetchPermits]);

  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const handleAction = async (id, status, actionLabel) => {
    const result = await Swal.fire({
      title: `Konfirmasi ${actionLabel}`,
      text: `Apakah Anda yakin ingin ${actionLabel.toLowerCase()} permohonan izin ini?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: status === 'HADIR' ? '#10b981' : '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      borderRadius: '24px'
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/attendances/${id}/status`, { status });
        showNotification(`Izin berhasil ${status === 'HADIR' ? 'disetujui' : 'ditolak'}`, "success");
        fetchPermits();
      } catch (err) {
        console.error("Action error:", err);
        showNotification("Gagal memproses tindakan", "error");
      }
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900">Akses Ditolak</h2>
            <p className="text-slate-500 font-bold mt-2">Halaman ini hanya untuk Administrator.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Izin</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">Review dan kelola permohonan izin karyawan</p>
          </div>
          <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Total Menunggu</p>
            <p className="text-2xl font-black text-blue-900 leading-none">{permits.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Karyawan</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Keterangan</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Lampiran</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Tanggal</th>
                  <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    </td>
                  </tr>
                ) : permits.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="bg-slate-50 w-20 h-20 rounded-4xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <FileCheck2 className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Semua Terproses!</h4>
                        <p className="text-slate-400 font-bold text-xs mt-2 px-4">Tidak ada permohonan izin yang menunggu persetujuan saat ini.</p>
                      </div>
                    </td>
                  </tr>

                ) : (
                  permits.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-sm">
                            {item.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-tight">{item.user.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.user.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-600 max-w-md line-clamp-2">{item.description || 'Tanpa keterangan'}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {item.photo_url ? (
                          <button
                            onClick={() => Swal.fire({
                              imageUrl: item.photo_url,
                              imageAlt: 'Lampiran Izin',
                              confirmButtonText: 'Tutup',
                              confirmButtonColor: '#3b82f6',
                              customClass: {
                                popup: 'rounded-4xl',
                                confirmButton: 'rounded-xl px-8 py-3 font-black text-xs uppercase tracking-widest'
                              }
                            })}
                            className="group relative inline-block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-slate-50 hover:border-blue-200"
                          >
                            <div className="w-14 h-14 relative">
                              <Image
                                src={item.photo_url}
                                alt="Lampiran"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-20">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Photo</span>
                          </div>
                        )}

                      </td>
                      <td className="px-8 py-6 text-center whitespace-nowrap">
                        <p className="text-xs font-black text-slate-900">{item.date}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(item.id, 'HADIR', 'Terima')}
                            className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm shadow-emerald-100 active:scale-90"
                            title="Terima Izin"
                          >
                            <Check className="w-5 h-5" strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'DITOLAK', 'Tolak')}
                            className="bg-rose-50 text-rose-600 p-3 rounded-2xl hover:bg-rose-600 hover:text-white transition-all duration-300 shadow-sm shadow-rose-100 active:scale-90"
                            title="Tolak Izin"
                          >
                            <X className="w-5 h-5" strokeWidth={3} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-slate-900 rounded-4xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-blue-600/20 p-5 rounded-4xl border border-white/10 shadow-inner">
              <Info className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-xl font-black tracking-tight mb-2">Kebijakan Persetujuan</h4>
              <p className="text-slate-400 font-bold text-xs leading-relaxed max-w-2xl">
                Setiap permohonan izin yang disetujui akan mengubah status presensi karyawan menjadi <span className="text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-400/10 rounded-md ml-1">&apos;HADIR&apos;</span>.
                Jika ditolak, status akan berubah menjadi <span className="text-rose-400 uppercase tracking-widest px-1.5 py-0.5 bg-rose-400/10 rounded-md ml-1">&apos;DITOLAK&apos;</span>.
                Tindakan ini bersifat permanen dan akan mempengaruhi kalkulasi laporan bulanan.
              </p>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}