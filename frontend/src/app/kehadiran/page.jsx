"use client";
import AdminLayout from "@/components/Adminlayout";
import React, { useState, useEffect } from "react";
import useAuthMiddleware from "@/hooks/auth";
import { useAuth } from "@/context/AuthContext";
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
  const { user: currentUser } = useAuth();
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
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [individualData, setIndividualData] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "employees"
  const [individualTimeframe, setIndividualTimeframe] = useState("month"); // "week", "month", "year"

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setActiveTab("employees");
      setSelectedUser(currentUser);
    }
  }, [currentUser]);

  const [employeesSummary, setEmployeesSummary] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const barChartRef = React.useRef(null);
  const pieChartRef = React.useRef(null);

  const fetchDetailedAttendance = async () => {
    try {
      const res = await api.get("/attendances");
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
        { width: 15 }, // G: ROLE
        { width: 25 }, // H: KANTOR
        { width: 15 }, // I: STATUS
        { width: 18 }, // J: JAM
        { width: 18 }  // K: TANGGAL
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

      setNotification({ show: true, message: "Menyusun lembar kerja bulanan...", type: "info" });

      // Group by Month-Year
      const groupedByMonth = details.reduce((acc, emp) => {
        const dateObj = new Date(emp.date);
        const monthYear = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(emp);
        return acc;
      }, {});

      // Add Monthly Sheets
      Object.entries(groupedByMonth).forEach(([monthYear, monthDetails]) => {
        const monthSheet = workbook.addWorksheet(monthYear);

        // Column definitions for monthly sheet
        monthSheet.columns = [
          { width: 8 },  // A: NO
          { width: 35 }, // B: NAMA
          { width: 15 }, // C: ROLE
          { width: 25 }, // D: KANTOR
          { width: 15 }, // E: STATUS
          { width: 18 }, // F: JAM
          { width: 18 }  // G: TANGGAL
        ];

        // --- HEADER ---
        monthSheet.mergeCells('A1:G2');
        const monthTitle = monthSheet.getCell('A1');
        monthTitle.value = `LAPORAN KEHADIRAN - ${monthYear.toUpperCase()}`;
        monthTitle.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        monthTitle.alignment = { vertical: 'middle', horizontal: 'center' };
        monthTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

        // --- TABLE HEADERS ---
        const headers = ["NO", "NAMA KARYAWAN", "ROLE", "PENEMPATAN KANTOR", "STATUS", "WAKTU", "TANGGAL"];
        headers.forEach((h, i) => {
          const cell = monthSheet.getCell(3, i + 1);
          cell.value = h;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } };
        });

        // --- DATA ---
        monthDetails.forEach((emp, idx) => {
          const rowIdx = 4 + idx;
          const rowData = [
            idx + 1,
            emp.user.name,
            emp.user.role || "Karyawan",
            emp.user.company || "Global",
            emp.status,
            emp.check_in_time || "--:--",
            emp.date
          ];

          rowData.forEach((val, i) => {
            const cell = monthSheet.getCell(rowIdx, i + 1);
            cell.value = val;
            cell.alignment = { horizontal: i === 1 ? 'left' : 'center', vertical: 'middle' };
            cell.font = { size: 10, color: { argb: 'FF334155' } };

            if (idx % 2 === 1) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }

            cell.border = { bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } } };

            if (i === 4) {
              if (val === 'HADIR') cell.font = { bold: true, color: { argb: 'FF059669' } };
              if (val === 'TELAT') cell.font = { bold: true, color: { argb: 'FFD97706' } };
            }
          });
        });
      });

      // --- VISUAL ANALYTICS SECTION ---
      const chartStartRow = 22;

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
      setNotification({ show: true, message: "Gagal mengekspor laporan. Silakan coba lagi.", type: "error" });
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

    // Fetch users for search filter
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data);

        // If not admin, find self in users and set as selected
        if (currentUser && currentUser.role !== 'admin') {
          const self = res.data.find(u => u.id === currentUser.id);
          if (self) {
            setSelectedUser(self);
            setUserSearchTerm(self.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();

    setMounted(true);
  }, [currentUser]);

  const fetchIndividualReport = async (userId) => {
    try {
      setLoadingUser(true);
      const res = await api.get(`/reports/user-summary?user_id=${userId}`);
      setIndividualData(res.data);
    } catch (err) {
      console.error("Failed to fetch individual report:", err);
      setNotification({ show: true, message: "Gagal memuat analitik user.", type: "error" });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchIndividualReport(selectedUser.id);
    } else {
      setIndividualData(null);
    }
  }, [selectedUser]);

  const fetchEmployeesSummary = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get("/reports/employees-summary");
      setEmployeesSummary(res.data);
    } catch (err) {
      console.error("Failed to fetch employees summary:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (activeTab === "employees" && employeesSummary.length === 0) {
      fetchEmployeesSummary();
    }
  }, [activeTab, employeesSummary.length]);

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

          <div className="flex flex-col md:flex-row gap-4">
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
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1.5 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === "overview"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            Ringkasan Utama
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === "employees"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            Laporan Karyawan
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
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

          </div>
        ) : (
          /* Employees Tab Content */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {selectedUser && individualData ? (
              <div className="space-y-6">
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearchTerm("");
                    }}
                    className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-colors mb-4 group"
                  >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke Daftar Karyawan
                  </button>
                )}

                {/* Individual User Analytics Card (Moved from Overview if needed, or mirrored) */}
                <div className="bg-white rounded-4xl shadow-xl shadow-blue-200/20 border-2 border-blue-50 p-8 md:p-12 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                  <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                    {/* User Left Info */}
                    <div className="w-full lg:w-1/3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-6 mb-8 text-slate-900">
                          <div className="w-20 h-20 bg-blue-600 rounded-4xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-200">
                            {individualData.user.avatar}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                            <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Analitik Individu</p>
                              <h4 className="text-3xl font-black leading-none">{individualData.user.name}</h4>
                              <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">{individualData.user.role}</p>
                            </div>

                            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/50">
                              {[
                                { id: 'week', label: 'Minggu' },
                                { id: 'month', label: 'Bulan' },
                                { id: 'year', label: 'Tahun' }
                              ].map((tf) => (
                                <button
                                  key={tf.id}
                                  onClick={() => setIndividualTimeframe(tf.id)}
                                  className={`px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${individualTimeframe === tf.id
                                      ? "bg-white text-blue-600 shadow-sm"
                                      : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                  {tf.label} Ini
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Presensi</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{individualData.timeframeStats?.[individualTimeframe]?.attendanceRate || individualData.overallStats.attendanceRate}%</p>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Terlambat</p>
                            <p className="text-3xl font-black text-orange-600 leading-none">{individualData.timeframeStats?.[individualTimeframe]?.lateRate || individualData.overallStats.lateRate}%</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 text-center">
                            <p className="text-xl font-black text-emerald-600 leading-none">{individualData.timeframeStats?.[individualTimeframe]?.hadir ?? individualData.overallStats.hadir}</p>
                            <p className="text-[8px] font-black text-emerald-400 uppercase mt-1">Hadir</p>
                          </div>
                          <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50 text-center">
                            <p className="text-xl font-black text-orange-600 leading-none">{individualData.timeframeStats?.[individualTimeframe]?.telat ?? individualData.overallStats.telat}</p>
                            <p className="text-[8px] font-black text-orange-400 uppercase mt-1">Telat</p>
                          </div>
                          <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50 text-center">
                            <p className="text-xl font-black text-rose-600 leading-none">{individualData.timeframeStats?.[individualTimeframe]?.absen ?? individualData.overallStats.absen}</p>
                            <p className="text-[8px] font-black text-rose-400 uppercase mt-1">Absen</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Status 7 Hari Terakhir</p>
                        <div className="flex gap-2">
                          {individualData.weeklyTrend.map((day, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                              <div
                                className={`w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${day.status === 'HADIR' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                  day.status === 'TELAT' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                                    'bg-rose-50 border-rose-100 text-rose-600'
                                  }`}
                                title={`${day.day}: ${day.status}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {day.status === 'HADIR' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />}
                                  {day.status === 'TELAT' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                                  {day.status === 'ABSEN' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />}
                                </svg>
                              </div>
                              <span className="text-[8px] font-black text-slate-400 uppercase">{day.day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* User Chart Trend */}
                    <div className="flex-1 bg-slate-50 rounded-4xl p-8 border border-slate-100 relative">
                      {loadingUser && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10 flex items-center justify-center rounded-4xl">
                          <div className="animate-spin w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      <div className="mb-8 flex justify-between items-end">
                        <div>
                          <h5 className="text-lg font-black text-slate-900">Grafik Kinerja Bulanan</h5>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Estimasi kehadiran (22 hari kerja/bulan)</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[8px] font-black text-slate-400 uppercase">Hadir</span></div>
                          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-500 rounded-full"></div><span className="text-[8px] font-black text-slate-400 uppercase">Telat</span></div>
                        </div>
                      </div>
                      <div className="h-70">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={individualData.sixMonthTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                            <Tooltip
                              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                              contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="present" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                            <Bar dataKey="late" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
                            <Bar dataKey="absent" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Performa Karyawan</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Data kehadiran kumulatif bulan ini</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 group">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Filter nama atau role..."
                        className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 placeholder:text-slate-400"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {loadingEmployees ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-48 bg-slate-50 rounded-4xl animate-pulse border border-slate-100"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employeesSummary
                      .filter(emp => emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || emp.role.toLowerCase().includes(employeeSearch.toLowerCase()))
                      .map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            const userMatch = users.find(u => u.id === emp.id);
                            if (userMatch) {
                              setSelectedUser(userMatch);
                              setUserSearchTerm(userMatch.name);
                            }
                          }}
                          className="bg-white border border-slate-100 p-6 rounded-4xl hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                        >
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                              {emp.avatar}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">{emp.name}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.role}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-emerald-50/50 p-3 rounded-2xl text-center">
                              <p className="text-lg font-black text-emerald-600 leading-none">{emp.hadir}</p>
                              <p className="text-[8px] font-bold text-emerald-400 uppercase mt-1">Hadir</p>
                            </div>
                            <div className="bg-orange-50/50 p-3 rounded-2xl text-center">
                              <p className="text-lg font-black text-orange-600 leading-none">{emp.telat}</p>
                              <p className="text-[8px] font-bold text-orange-400 uppercase mt-1">Telat</p>
                            </div>
                            <div className="bg-rose-50/50 p-3 rounded-2xl text-center">
                              <p className="text-lg font-black text-rose-600 leading-none">{emp.absen}</p>
                              <p className="text-[8px] font-bold text-rose-400 uppercase mt-1">Absen</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Notification
          show={notification.show}
          message={notification.message}
          type={notification.type}
        />
      </div >
    </AdminLayout >
  );
}
