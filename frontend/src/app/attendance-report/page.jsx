"use client";
import AdminLayout from "@/components/Adminlayout";
import React, { useState, useEffect } from "react";
import useAuthMiddleware from "@/hooks/auth";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";

import api from "@/utils/axios";
import Notification from "@/components/Notification";

export default function AttendanceReportPage() {
  useAuthMiddleware();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "info" });
  const [reportData, setReportData] = useState({
    overallStats: { attendanceRate: 0, lateRate: 0, absenceRate: 0, totalPresent: 0 },
    sixMonthTrend: [],
    weeklyTrend: [],
    todayDistribution: [],
    departmentStats: [],
    timeDistribution: [],
    detailedAttendance: []
  });

  const barChartRef = React.useRef(null);
  const pieChartRef = React.useRef(null);

  const fetchDetailedAttendance = async () => {
    try {
      const res = await api.get("/attendances?period=month");
      // Filter out weekends (0 = Sunday, 6 = Saturday)
      const filteredData = res.data.filter(emp => {
        const day = new Date(emp.date).getDay();
        return day !== 0 && day !== 6;
      });
      return filteredData;
    } catch (err) {
      console.error("Failed to fetch detailed attendance:", err);
      return [];
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setNotification({ show: true, message: "Sedang menyiapkan laporan eksekutif...", type: "info" });
    try {
      const rawDetails = await fetchDetailedAttendance();

      // Filter out weekends (0 = Sunday, 6 = Saturday)
      const details = rawDetails.filter(emp => {
        const day = new Date(emp.date).getDay();
        return day !== 0 && day !== 6;
      });

      if (!details || details.length === 0) {
        setNotification({ show: true, message: "Tidak ada data absensi untuk diexport.", type: "warning" });
        setLoading(false);
        return;
      }

      setNotification({ show: true, message: "Menangkap data visual...", type: "info" });

      // Capture charts as images
      const captureChart = async (ref) => {
        if (!ref.current) return null;
        try {
          const canvas = await html2canvas(ref.current, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
          });
          return canvas.toDataURL("image/png");
        } catch (e) {
          console.error("Capture failed", e);
          return null;
        }
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      const barChartImg = await captureChart(barChartRef);
      const pieChartImg = await captureChart(pieChartRef);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendance Dashboard");

      // Column definitions
      worksheet.columns = [
        { width: 5 },  // A: Gap
        { width: 25 }, // B: Metric Labels
        { width: 15 }, // C: Values
        { width: 8 },  // D: Gap
        { width: 10 }, // E: NO
        { width: 35 }, // F: NAMA
        { width: 25 }, // G: KANTOR
        { width: 15 }, // H: STATUS
        { width: 18 }, // I: JAM
        { width: 18 }  // J: TANGGAL
      ];

      // --- BRANDING HEADER ---
      worksheet.mergeCells('B2:C3');
      const brandCell = worksheet.getCell('B2');
      brandCell.value = "ATTENDTRACK";
      brandCell.font = { name: 'Arial Black', size: 20, color: { argb: 'FF1E40AF' } };
      brandCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('E2:J3');
      const mainTitle = worksheet.getCell('E2');
      mainTitle.value = "MONTHLY ATTENDANCE ANALYSIS REPORT";
      mainTitle.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0F172A' } };
      mainTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

      // --- INFO SECTION ---
      worksheet.getCell('E4').value = `Generated: ${new Date().toLocaleString('id-ID')}`;
      worksheet.getCell('E4').font = { size: 10, italic: true, color: { argb: 'FF64748B' } };
      worksheet.mergeCells('E4:J4');

      // --- SIDEBAR METRICS ---
      const drawMetric = (row, label, value, color, textColor) => {
        worksheet.getCell(row, 2).value = label;
        worksheet.getCell(row, 2).font = { size: 9, bold: true, color: { argb: 'FF64748B' } };

        const vCell = worksheet.getCell(row + 1, 2);
        vCell.value = value;
        vCell.font = { size: 24, bold: true, color: { argb: textColor } };
        vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        vCell.alignment = { horizontal: 'center', vertical: 'middle' };
        vCell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        worksheet.mergeCells(row + 1, 2, row + 2, 3);
      };

      drawMetric(6, "ATTENDANCE RATE", `${reportData.overallStats.attendanceRate}%`, 'FFDBEAFE', 'FF1E40AF');
      drawMetric(10, "LATE RATE", `${reportData.overallStats.lateRate}%`, 'FFFFEDD5', 'FF9A3412');
      drawMetric(14, "ABSENCE RATE", `${reportData.overallStats.absenceRate}%`, 'FFFEE2E2', 'FF991B1B');
      drawMetric(18, "TOTAL RECORDS", details.length, 'FFF8FAFC', 'FF334155');

      // --- DATA TABLE ---
      const tableHeaderRow = 6;
      const headers = ["NO", "NAMA KARYAWAN", "PENEMPATAN KANTOR", "STATUS", "WAKTU", "TANGGAL"];
      headers.forEach((h, i) => {
        const cell = worksheet.getCell(tableHeaderRow, 5 + i);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } };
      });

      details.forEach((emp, idx) => {
        const rowIdx = tableHeaderRow + 1 + idx;
        const rowData = [
          idx + 1,
          emp.user.name,
          emp.user.company || "Global",
          emp.status,
          emp.check_in_time || "--:--",
          emp.date
        ];

        rowData.forEach((val, i) => {
          const cell = worksheet.getCell(rowIdx, 5 + i);
          cell.value = val;
          cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' };
          cell.font = { size: 10, color: { argb: 'FF334155' } };

          // Striping
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }

          cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } };

          // Status Coloring
          if (i === 3) {
            if (val === 'HADIR') cell.font = { bold: true, color: { argb: 'FF059669' } };
            if (val === 'TELAT') cell.font = { bold: true, color: { argb: 'FFD97706' } };
          }
        });
      });

      // --- VISUAL ANALYTICS SECTION ---
      const chartStartRow = Math.max(22, tableHeaderRow + details.length + 3);

      worksheet.mergeCells(`B${chartStartRow}:J${chartStartRow}`);
      const vizTitle = worksheet.getCell(`B${chartStartRow}`);
      vizTitle.value = "VISUAL ANALYTICS & TRENDS";
      vizTitle.font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
      vizTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      vizTitle.alignment = { horizontal: 'left', vertical: 'middle' };

      if (barChartImg) {
        try {
          const imageId = workbook.addImage({ base64: barChartImg, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: 1, row: chartStartRow + 1 },
            ext: { width: 450, height: 260 }
          });
        } catch (e) { console.error("Bar chart embed failed", e); }
      }

      if (pieChartImg) {
        try {
          const imageId = workbook.addImage({ base64: pieChartImg, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: 6, row: chartStartRow + 1 },
            ext: { width: 350, height: 260 }
          });
        } catch (e) { console.error("Pie chart embed failed", e); }
      }

      setNotification({ show: true, message: "Finalisasi file...", type: "info" });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `AttendTrack_Executive_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      setNotification({ show: true, message: "Laporan eksekutif berhasil diunduh!", type: "success" });
      setLoading(false);
    } catch (err) {
      console.error("Export failed:", err);
      setNotification({ show: true, message: "Gagal memproses laporan.", type: "error" });
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reports/summary");
        setReportData(prev => ({ ...prev, ...res.data }));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        setError("Gagal memuat data laporan. Coba refresh halaman.");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
    setMounted(true);
  }, []);

  const {
    overallStats,
    sixMonthTrend,
    weeklyTrend,
    todayDistribution,
    departmentStats,
    timeDistribution
  } = reportData;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analisis Kehadiran</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">Visualisasi data dan analitik komprehensif sistem AttendTrack</p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-100 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export Laporan Bulanan
          </button>
        </div>

        {/* Highlight Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {loading && !reportData.overallStats.totalPresent && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-[2.5rem]">
              <div className="animate-spin w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8 group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100">Live Analytics</span>
            </div>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-none mb-2">Total Kehadiran</p>
            <p className="text-5xl font-black text-slate-900 tracking-tight">{overallStats.attendanceRate}<span className="text-2xl text-slate-300 ml-1">%</span></p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8 group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="bg-orange-50 text-orange-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-100">Monthly Avg</span>
            </div>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-none mb-2">Rata-rata Terlambat</p>
            <p className="text-5xl font-black text-slate-900 tracking-tight">{overallStats.lateRate}<span className="text-2xl text-slate-300 ml-1">%</span></p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8 group hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-100">Real-time</span>
            </div>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-none mb-2">Tingkat Absensi</p>
            <p className="text-5xl font-black text-slate-900 tracking-tight">{overallStats.absenceRate}<span className="text-2xl text-slate-300 ml-1">%</span></p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-8 py-4 rounded-3xl text-sm font-bold flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 6-Month Trend */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Trend 6 Bulan Terakhir</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Pola kehadiran historis sistem</p>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sixMonthTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
                  <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-6">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hadir</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telat</span></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-rose-500 rounded-full"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Absen</span></div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8">
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Aktivitas Mingguan</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Breakdown performa 7 hari terakhir</p>
              </div>
              <div className="h-[280px]" ref={barChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', shadow: 'xl' }} />
                    <Bar dataKey="present" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="late" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8">
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi Hari Ini</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Status kehadiran real-time</p>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-around gap-8" ref={pieChartRef}>
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={todayDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                        {todayDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  {todayDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 leading-none">{item.value}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{item.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Komparasi Penempatan</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Efektivitas presensi berdasarkan lokasi (%)</p>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="dept" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                  <Bar dataKey="present" fill="#10b981" radius={[0, 10, 10, 0]} barSize={25} />
                  <Bar dataKey="late" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Analisa Waktu Kedatangan</h3>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Distribusi jam masuk karyawan hari ini</p>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none' }} />
                  <Line type="stepAfter" dataKey="checkins" stroke="#3b82f6" strokeWidth={5} dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Report Summary Card */}
        <div className="bg-slate-900 rounded-[3rem] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md">
              <h3 className="text-3xl font-black text-white tracking-tight mb-4">Ringkasan Eksekutif</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed">
                Berdasarkan data analitik sistem, hari ini menunjukkan performa kehadiran sebesar <span className="text-emerald-400">{overallStats.attendanceRate}%</span>.
                Optimalkan manajemen waktu pada lokasi dengan tingkat keterlambatan tinggi.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 flex-1 w-full">
              <div className="text-center">
                <p className="text-4xl font-black text-white tracking-tighter">{overallStats.attendanceRate}%</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Avg Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-emerald-400 tracking-tighter">{overallStats.totalPresent}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Total Present</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-orange-400 tracking-tighter">{overallStats.lateRate}%</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Late Rate</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-rose-500 tracking-tighter">{overallStats.absenceRate}%</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Absence Rate</p>
              </div>
            </div>
          </div>
        </div>

        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      </div>
    </AdminLayout>
  );
}
