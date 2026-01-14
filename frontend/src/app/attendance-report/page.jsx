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
      return res.data;
    } catch (err) {
      console.error("Failed to fetch detailed attendance:", err);
      return [];
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setNotification({ show: true, message: "Sedang menyiapkan data bulanan...", type: "info" });
    try {
      const details = await fetchDetailedAttendance();

      if (!details || details.length === 0) {
        setNotification({ show: true, message: "Tidak ada data absensi untuk diexport.", type: "warning" });
        setLoading(false);
        return;
      }

      setNotification({ show: true, message: "Mengambil gambar grafik...", type: "info" });

      // Capture charts as images
      const captureChart = async (ref) => {
        if (!ref.current) return null;
        try {
          const canvas = await html2canvas(ref.current, {
            scale: 1,
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

      // Wait a bit for charts to be fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      const barChartImg = await captureChart(barChartRef);
      const pieChartImg = await captureChart(pieChartRef);

      // Initialize ExcelJS Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendance Dashboard");

      // Set column widths
      worksheet.columns = [
        { width: 25 }, { width: 15 }, { width: 5 }, { width: 5 }, // Sidebar
        { width: 10 }, { width: 30 }, { width: 25 }, { width: 15 }, { width: 18 }, { width: 18 } // Table
      ];

      // --- HEADER ---
      worksheet.mergeCells('A1:C2');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = "ATTENDTRACK MONTHLY REPORT";
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };

      worksheet.mergeCells('E1:J2');
      const tableTitleCell = worksheet.getCell('E1');
      tableTitleCell.value = "TABEL KEHADIRAN KARYAWAN (BULANAN)";
      tableTitleCell.font = { size: 16, bold: true, color: { argb: 'FF1F2937' } };
      tableTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('A3:C3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      dateCell.font = { italic: true, size: 12 };
      dateCell.alignment = { horizontal: 'center' };

      // --- SIDEBAR STATS ---
      const statsStartRow = 5;
      const stats = [
        { label: "Attendance Rate", value: `${reportData.overallStats.attendanceRate}%`, color: 'FFDBEAFE', textColor: 'FF1E40AF' },
        { label: "Late Rate", value: `${reportData.overallStats.lateRate}%`, color: 'FFFFEDD5', textColor: 'FF9A3412' },
        { label: "Absence Rate", value: `${reportData.overallStats.absenceRate}%`, color: 'FFFEE2E2', textColor: 'FF991B1B' },
        { label: "Total Data", value: details.length, color: 'FFF3F4F6', textColor: 'FF374151' }
      ];

      stats.forEach((stat, i) => {
        const rowIdx = statsStartRow + (i * 4);
        worksheet.getCell(rowIdx, 1).value = stat.label.toUpperCase();
        const vCell = worksheet.getCell(rowIdx + 1, 1);
        vCell.value = stat.value;
        vCell.font = { size: 22, bold: true, color: { argb: stat.textColor } };
        vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stat.color } };
        vCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(rowIdx + 1, 1, rowIdx + 2, 2);
      });

      // --- MAIN TABLE ---
      const headers = ["No", "Nama Lengkap", "Perusahaan", "Status", "Jam Check-in", "Tanggal"];
      headers.forEach((h, i) => {
        const cell = worksheet.getCell(4, 5 + i);
        cell.value = h;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.alignment = { horizontal: 'center' };
      });

      details.forEach((emp, idx) => {
        const rowIdx = 5 + idx;
        worksheet.getCell(rowIdx, 5).value = idx + 1;
        worksheet.getCell(rowIdx, 6).value = emp.user.name;
        worksheet.getCell(rowIdx, 7).value = emp.user.company || "-";
        worksheet.getCell(rowIdx, 8).value = emp.status;
        worksheet.getCell(rowIdx, 9).value = emp.check_in_time || "-";
        worksheet.getCell(rowIdx, 10).value = emp.date;

        const row = worksheet.getRow(rowIdx);
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (colNumber >= 5) {
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
            cell.alignment = { horizontal: 'center' };
          }
        });

        const statusCell = worksheet.getCell(rowIdx, 8);
        if (emp.status === 'HADIR') statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
        if (emp.status === 'TELAT') statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      });

      // --- EMBED CHARTS ---
      const tableEndRow = 5 + details.length + 3;

      if (barChartImg) {
        try {
          const imageId = workbook.addImage({ base64: barChartImg, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: 4.5, row: tableEndRow },
            ext: { width: 500, height: 300 }
          });
        } catch (e) { console.error("Failed to add bar chart image", e); }
      }

      if (pieChartImg) {
        try {
          const imageId = workbook.addImage({ base64: pieChartImg, extension: 'png' });
          worksheet.addImage(imageId, {
            tl: { col: 4.5, row: tableEndRow + 18 },
            ext: { width: 450, height: 300 }
          });
        } catch (e) { console.error("Failed to add pie chart image", e); }
      }

      setNotification({ show: true, message: "Membangun file Excel...", type: "info" });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Monthly_Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      setNotification({ show: true, message: "Laporan berhasil didownload!", type: "success" });
      setLoading(false);
    } catch (err) {
      console.error("Export failed:", err);
      setNotification({ show: true, message: "Gagal mendownload laporan.", type: "error" });
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Attendance Report</h2>
          <p className="text-gray-600">Comprehensive analytics and data visualization</p>
        </div>

        <div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 shadow-lg hover:shadow-green-100 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export to Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-4 rounded-xl">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-green-600 text-sm font-medium">Real-time</span>
          </div>
          <p className="text-gray-600 text-sm">Overall Attendance Rate</p>
          <p className="text-4xl font-bold mt-2">{overallStats.attendanceRate}%</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-4 rounded-xl">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-orange-600 text-sm font-medium">Monthly Avg</span>
          </div>
          <p className="text-gray-600 text-sm">Average Late Arrivals</p>
          <p className="text-4xl font-bold mt-2">{overallStats.lateRate}%</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-4 rounded-xl">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-red-600 text-sm font-medium">Today</span>
          </div>
          <p className="text-gray-600 text-sm">Absence Rate</p>
          <p className="text-4xl font-bold mt-2">{overallStats.absenceRate}%</p>
        </div>
      </div>

      {error && <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-center font-bold">{error}</div>}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 6-Month Trend */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2">6-Month Attendance Trend</h3>
          <p className="text-gray-500 text-sm mb-6">Historical attendance patterns and trends</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sixMonthTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>Present</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>Late</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>Absent</div>
          </div>
        </div>

        {/* Weekly Trend + Today's Distribution */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Weekly Attendance Trend</h3>
            <p className="text-gray-500 text-sm mb-6">Daily breakdown for the current week</p>
            <div className="h-[250px]" ref={barChartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Today's Distribution</h3>
            <p className="text-gray-500 text-sm mb-6">Current attendance status</p>
            <div className="flex flex-col md:flex-row items-center justify-around" ref={pieChartRef}>
              <div className="w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={todayDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {todayDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-1 gap-4 mt-6 md:mt-0 text-center md:text-left">
                {todayDistribution.map((item) => (
                  <div key={item.name}>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Department Comparison</h3>
          <p className="text-gray-500 text-sm mb-6">Attendance rates by department (%)</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="dept" type="category" width={100} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="present" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="late" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Check-in Time Analysis</h3>
          <p className="text-gray-500 text-sm mb-6">Today's distribution of arrival times</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="stepAfter" dataKey="checkins" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
        <p className="text-gray-600 mb-6">Key insights for today</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-black text-blue-600">{overallStats.attendanceRate}%</p>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Avg Attendance</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-green-600">{overallStats.totalPresent}</p>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Total Present</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-orange-600">{overallStats.lateRate}%</p>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Late Rate</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-red-600">{overallStats.absenceRate}%</p>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Absence Rate</p>
          </div>
        </div>
      </div>

      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </AdminLayout>
  );
}