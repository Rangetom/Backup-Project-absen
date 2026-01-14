// dashboard
// "use client";

// import React, { useState, useEffect } from "react";
// import { useAuth } from "@/context/AuthContext";
// import useAuthMiddleware from "@/hooks/auth";
// import Link from "next/link";
// import api from "@/utils/axios";

// export default function DashboardPage() {
//   useAuthMiddleware();
//   const { logout } = useAuth();

//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [recentAttendance, setRecentAttendance] = useState([]);
//   const [selectedAttendance, setSelectedAttendance] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await api.get("/attendances");
//         setRecentAttendance(res.data);
//       } catch {
//         setError("Gagal memuat data absensi");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* HEADER */}
//       <header className="bg-white shadow fixed top-0 left-0 right-0 z-40">
//         <div className="flex items-center justify-between px-4 md:px-6 py-4">
//           <div className="flex items-center gap-3">
//             {/* HAMBURGER */}
//             <button
//               className="md:hidden"
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//             >
//               ☰
//             </button>
//             <h1 className="text-xl font-bold">AttendTrack</h1>
//           </div>

//           <div className="flex items-center gap-4">
//             <input
//               className="hidden md:block px-4 py-2 border rounded-lg"
//               placeholder="Search..."
//             />

//             <div className="relative">
//               <button
//                 onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//                 className="bg-blue-600 text-white w-10 h-10 rounded-full font-bold"
//               >
//                 AH
//               </button>

//               {showProfileDropdown && (
//                 <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border">
//                   <div className="p-4 border-b">
//                     <p className="font-semibold">Admin HR</p>
//                     <p className="text-sm text-gray-500">admin@company.com</p>
//                   </div>
//                   <button
//                     onClick={logout}
//                     className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* SIDEBAR */}
//       <aside
//         className={`fixed top-16 left-0 h-full w-64 bg-white shadow z-30 transform transition-transform
//         ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
//       >
//         {["Dashboard", "Employees", "Attendance Reports", "Settings"].map(
//           (item) => (
//             <Link
//               key={item}
//               href="#"
//               className="block px-6 py-4 hover:bg-gray-100"
//               onClick={() => setSidebarOpen(false)}
//             >
//               {item}
//             </Link>
//           )
//         )}
//       </aside>

//       {/* CONTENT */}
//       <main className="pt-24 md:ml-64 px-4 md:px-8 pb-10">
//         <div className="bg-white rounded-xl shadow p-6">
//           <h2 className="text-lg font-semibold mb-4">Recent Attendance</h2>

//           {loading && <p>Memuat...</p>}
//           {error && <p className="text-red-600">{error}</p>}

//           {/* DESKTOP TABLE */}
//           <div className="hidden md:block">
//             {recentAttendance.map((emp) => (
//               <div
//                 key={emp.id}
//                 className="grid grid-cols-12 py-4 border-b items-center"
//               >
//                 <div className="col-span-4">
//                   <p className="font-medium">{emp.user.name}</p>
//                   <p className="text-sm text-gray-500">{emp.user.code}</p>
//                 </div>
//                 <div className="col-span-2 text-center">
//                   {emp.check_in_time}
//                 </div>
//                 <div className="col-span-2 text-center">
//                   <span
//                     className={`px-3 py-1 rounded-full text-sm ${
//                       emp.status === "HADIR"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-orange-100 text-orange-700"
//                     }`}
//                   >
//                     {emp.status}
//                   </span>
//                 </div>
//                 <div className="col-span-3 text-center">
//                   {emp.location}
//                 </div>
//                 <div className="col-span-1 text-center">
//                   <button
//                     onClick={() => setSelectedAttendance(emp)}
//                     className="text-blue-600"
//                   >
//                     View
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* MOBILE CARD */}
//           <div className="md:hidden space-y-4">
//             {recentAttendance.map((emp) => (
//               <div
//                 key={emp.id}
//                 className="border rounded-xl p-4 shadow-sm"
//               >
//                 <p className="font-semibold">{emp.user.name}</p>
//                 <p className="text-sm text-gray-500">{emp.user.email}</p>
//                 <p className="mt-2 text-sm">
//                   ⏰ {emp.check_in_time}
//                 </p>
//                 <p className="text-sm">📍 {emp.location}</p>

//                 <button
//                   onClick={() => setSelectedAttendance(emp)}
//                   className="mt-3 text-blue-600 font-medium"
//                 >
//                   View Photo
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </main>

//       {/* MODAL FOTO */}
//       {selectedAttendance && (
//         <div
//           className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
//           onClick={() => setSelectedAttendance(null)}
//         >
//           <div
//             className="bg-white rounded-xl p-4 max-w-lg w-full"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <h3 className="font-semibold mb-2">
//               {selectedAttendance.user.name}
//             </h3>
//             <img
//               src={selectedAttendance.photo_url}
//               className="w-full rounded-lg"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// home
// "use client";

// import { useState, useRef } from "react";
// import useAuthMiddleware from "@/hooks/auth";
// import { useAuth } from "@/context/AuthContext";

// export default function EmployeeHome() {
//   useAuthMiddleware();
//   const { logout } = useAuth();

//   const [isCapturing, setIsCapturing] = useState(false);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [location, setLocation] = useState(null);
//   const [address, setAddress] = useState(null);

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);

//   // ===== LOCATION =====
//   const getLocation = async () => {
//     navigator.geolocation.getCurrentPosition(
//       async (pos) => {
//         const lat = pos.coords.latitude;
//         const lng = pos.coords.longitude;
//         setLocation({ latitude: lat, longitude: lng });

//         try {
//           const res = await fetch(
//             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
//           );
//           const data = await res.json();
//           setAddress(data.display_name || "Lokasi tidak diketahui");
//         } catch {
//           setAddress("Lokasi tidak diketahui");
//         }
//       },
//       () => alert("Izin lokasi ditolak"),
//       { enableHighAccuracy: true }
//     );
//   };

//   // ===== START CAMERA =====
//   const startSelfie = async () => {
//     setIsCapturing(true);
//     setCapturedImage(null);
//     await getLocation();

//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: { facingMode: "user" },
//       audio: false,
//     });

//     videoRef.current.srcObject = stream;
//     streamRef.current = stream;
//   };

//   // ===== WRAP TEXT =====
//   const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
//     const words = text.split(" ");
//     let line = "";
//     let currentY = y;

//     for (let i = 0; i < words.length; i++) {
//       const testLine = line + words[i] + " ";
//       if (ctx.measureText(testLine).width > maxWidth && i > 0) {
//         ctx.strokeText(line, x, currentY);
//         ctx.fillText(line, x, currentY);
//         line = words[i] + " ";
//         currentY += lineHeight;
//       } else {
//         line = testLine;
//       }
//     }
//     ctx.strokeText(line, x, currentY);
//     ctx.fillText(line, x, currentY);
//   };

//   // ===== TAKE PHOTO =====
//   const takePhoto = () => {
//     if (!location || !address) {
//       alert("Lokasi belum siap");
//       return;
//     }

//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     const ctx = canvas.getContext("2d");
//     ctx.drawImage(video, 0, 0);

//     const now = new Date();
//     const tanggal = now.toLocaleDateString("id-ID");
//     const jam = now.toLocaleTimeString("id-ID");

//     ctx.font = "bold 18px Arial";
//     ctx.fillStyle = "white";
//     ctx.strokeStyle = "black";
//     ctx.lineWidth = 2;

//     let y = canvas.height - 90;
//     ctx.strokeText(`Tanggal: ${tanggal}`, 10, y);
//     ctx.fillText(`Tanggal: ${tanggal}`, 10, y);
//     y += 24;

//     ctx.strokeText(`Jam: ${jam}`, 10, y);
//     ctx.fillText(`Jam: ${jam}`, 10, y);
//     y += 24;

//     wrapText(ctx, address, 10, y, canvas.width - 20, 22);

//     setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
//   };

//   // ===== CLOSE CAMERA =====
//   const closeSelfie = () => {
//     streamRef.current?.getTracks().forEach((t) => t.stop());
//     setIsCapturing(false);
//     setCapturedImage(null);
//     setAddress(null);
//   };

//   // ===== SUBMIT =====
//   const submitCheckIn = async () => {
//     if (!capturedImage || !location) {
//       alert("Data belum lengkap");
//       return;
//     }

//     try {
//       const token = localStorage.getItem("auth_token");

//       const res = await fetch("http://127.0.0.1:8000/api/attendance/checkin", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           photo: capturedImage,
//           latitude: location.latitude,
//           longitude: location.longitude,
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) return alert(data.message || "Gagal check-in");

//       alert(data.message);
//       closeSelfie();
//     } catch {
//       alert("Gagal mengirim data");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* HEADER */}
//       <header className="bg-white shadow px-4 md:px-10 py-4 flex justify-between items-center">
//         <h1 className="text-xl md:text-2xl font-bold">AttendTrack</h1>
//         <button onClick={logout} className="text-red-600 font-medium">
//           Logout
//         </button>
//       </header>

//       {/* CONTENT */}
//       <main className="p-4 md:p-10">
//         <div className="bg-white p-6 md:p-10 rounded-2xl shadow text-center max-w-xl mx-auto">
//           <h2 className="text-lg md:text-xl font-semibold mb-6">
//             Check-In Selfie
//           </h2>
//           <button
//             onClick={startSelfie}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full w-full md:w-auto"
//           >
//             Start Check-In
//           </button>
//         </div>
//       </main>

//       {/* MODAL CAMERA */}
//       {isCapturing && (
//         <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
//           <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-3xl overflow-hidden flex flex-col">
//             <div className="bg-blue-600 text-white py-4 text-center font-bold">
//               Ambil Selfie
//             </div>

//             <div className="flex-1 bg-black flex items-center justify-center p-4">
//               {!capturedImage ? (
//                 <video
//                   ref={videoRef}
//                   autoPlay
//                   playsInline
//                   className="w-full max-h-[70vh] object-contain rounded-xl"
//                   style={{ transform: "scaleX(-1)" }}
//                 />
//               ) : (
//                 <img
//                   src={capturedImage}
//                   className="w-full max-h-[70vh] object-contain rounded-xl"
//                 />
//               )}
//               <canvas ref={canvasRef} className="hidden" />
//             </div>

//             <div className="p-4 flex flex-col sm:flex-row gap-4 justify-center">
//               {!capturedImage ? (
//                 <>
//                   <button
//                     onClick={takePhoto}
//                     className="bg-blue-600 text-white py-3 px-6 rounded-full w-full"
//                   >
//                     Ambil Foto
//                   </button>
//                   <button
//                     onClick={closeSelfie}
//                     className="bg-gray-500 text-white py-3 px-6 rounded-full w-full"
//                   >
//                     Batal
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   <button
//                     onClick={() => setCapturedImage(null)}
//                     className="bg-orange-500 text-white py-3 px-6 rounded-full w-full"
//                   >
//                     Ulang
//                   </button>
//                   <button
//                     onClick={submitCheckIn}
//                     className="bg-green-600 text-white py-3 px-6 rounded-full w-full"
//                   >
//                     Kirim & Check-In
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// attendance check in
// "use client";

// import React, { useState } from "react";
// import { useAuth } from "@/context/AuthContext";
// import {
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// export default function AttendanceReportPage() {
//   const { logout } = useAuth();

//   const [showProfileDropdown, setShowProfileDropdown] = useState(false);
//   const [showExportMenu, setShowExportMenu] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const handleLogout = async () => {
//     await logout();
//   };

//   const handleExport = (format) => {
//     alert(`Export ${format} sedang dikembangkan`);
//     setShowExportMenu(false);
//   };

//   // ===== DATA =====
//   const sixMonthData = [
//     { month: "Jan", present: 650, late: 30, absent: 20 },
//     { month: "Feb", present: 660, late: 28, absent: 22 },
//     { month: "Mar", present: 670, late: 25, absent: 25 },
//     { month: "Apr", present: 680, late: 22, absent: 18 },
//     { month: "May", present: 690, late: 20, absent: 10 },
//     { month: "Jun", present: 700, late: 18, absent: 12 },
//   ];

//   const weeklyData = [
//     { day: "Mon", present: 52, late: 8, absent: 5 },
//     { day: "Tue", present: 48, late: 10, absent: 7 },
//     { day: "Wed", present: 50, late: 9, absent: 6 },
//     { day: "Thu", present: 55, late: 7, absent: 3 },
//     { day: "Fri", present: 45, late: 12, absent: 8 },
//   ];

//   const pieData = [
//     { name: "Present", value: 60, color: "#10b981" },
//     { name: "Late", value: 20, color: "#f59e0b" },
//     { name: "Absent", value: 20, color: "#ef4444" },
//   ];

//   const departmentData = [
//     { dept: "Engineering", present: 95, late: 4, absent: 1 },
//     { dept: "Design", present: 92, late: 6, absent: 2 },
//     { dept: "Marketing", present: 88, late: 8, absent: 4 },
//     { dept: "Sales", present: 90, late: 7, absent: 3 },
//     { dept: "HR", present: 96, late: 3, absent: 1 },
//     { dept: "Finance", present: 94, late: 5, absent: 1 },
//   ];

//   const checkInTimeData = [
//     { time: "7:00", checkins: 5 },
//     { time: "7:30", checkins: 12 },
//     { time: "8:00", checkins: 25 },
//     { time: "8:30", checkins: 28 },
//     { time: "9:00", checkins: 18 },
//     { time: "9:30", checkins: 8 },
//     { time: "10:00", checkins: 4 },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* ================= HEADER ================= */}
//       <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
//         <div className="flex items-center justify-between px-4 md:px-6 py-4">
//           <div className="flex items-center gap-3">
//             {/* Hamburger */}
//             <button
//               className="md:hidden p-2 rounded-lg hover:bg-gray-100"
//               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//               </svg>
//             </button>

//             <div className="bg-blue-600 p-2 rounded-lg">
//               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" />
//               </svg>
//             </div>
//             <h1 className="text-xl md:text-2xl font-bold">AttendTrack</h1>
//           </div>

//           <div className="flex items-center gap-4">
//             {/* Export */}
//             <div className="relative">
//               <button
//                 onClick={() => setShowExportMenu(!showExportMenu)}
//                 className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm md:text-base"
//               >
//                 Export
//               </button>

//               {showExportMenu && (
//                 <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow border">
//                   <button
//                     onClick={() => handleExport("PDF")}
//                     className="block w-full px-4 py-2 hover:bg-gray-50 text-left"
//                   >
//                     PDF
//                   </button>
//                   <button
//                     onClick={() => handleExport("Excel")}
//                     className="block w-full px-4 py-2 hover:bg-gray-50 text-left border-t"
//                   >
//                     Excel
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Profile */}
//             <div className="relative">
//               <button onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
//                 <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
//                   AH
//                 </div>
//               </button>

//               {showProfileDropdown && (
//                 <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow border">
//                   <div className="p-4 border-b">
//                     <p className="font-semibold">Admin HR</p>
//                     <p className="text-sm text-gray-500">admin@company.com</p>
//                   </div>
//                   <button
//                     onClick={handleLogout}
//                     className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* ================= LAYOUT ================= */}
//       <div className="flex pt-16">
//         {/* SIDEBAR */}
//         <aside
//           className={`fixed md:static z-40 top-16 left-0 h-screen w-64 bg-white shadow-md transform transition-transform duration-300
//           ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
//         >
//           <nav className="mt-6">
//             {["Dashboard", "Employees", "Attendance Reports", "Settings"].map((item) => (
//               <button
//                 key={item}
//                 onClick={() => setIsSidebarOpen(false)}
//                 className={`w-full text-left px-6 py-4 ${
//                   item === "Attendance Reports"
//                     ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
//                     : "text-gray-600 hover:bg-gray-50"
//                 }`}
//               >
//                 {item}
//               </button>
//             ))}
//           </nav>
//         </aside>

//         {/* MAIN */}
//         <main className="flex-1 p-4 md:p-8 md:ml-64">
//           <h2 className="text-2xl md:text-3xl font-bold mb-2">Attendance Report</h2>
//           <p className="text-gray-600 mb-8">Analytics & visualization</p>

//           {/* STATS */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             {["94.2%", "5.2%", "2.8%"].map((v, i) => (
//               <div key={i} className="bg-white rounded-2xl shadow p-6">
//                 <p className="text-4xl font-bold">{v}</p>
//               </div>
//             ))}
//           </div>

//           {/* CHARTS */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//             <div className="bg-white rounded-2xl shadow p-6">
//               <ResponsiveContainer width="100%" height={250}>
//                 <LineChart data={sixMonthData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="month" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line dataKey="present" stroke="#10b981" />
//                   <Line dataKey="late" stroke="#f59e0b" />
//                   <Line dataKey="absent" stroke="#ef4444" />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="bg-white rounded-2xl shadow p-6">
//               <ResponsiveContainer width="100%" height={250}>
//                 <BarChart data={weeklyData}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="day" />
//                   <YAxis />
//                   <Tooltip />
//                   <Bar dataKey="present" fill="#10b981" />
//                   <Bar dataKey="late" fill="#f59e0b" />
//                   <Bar dataKey="absent" fill="#ef4444" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* PIE */}
//           <div className="bg-white rounded-2xl shadow p-6 mb-8">
//             <ResponsiveContainer width="100%" height={250}>
//               <PieChart>
//                 <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90}>
//                   {pieData.map((e, i) => (
//                     <Cell key={i} fill={e.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }


// attendance setting 
// "use client";

// import { useEffect, useState } from "react";
// import api from "@/utils/axios";
// import AdminLayout from "@/components/Adminlayout";

// export default function AttendanceSettingPage() {
//   const [form, setForm] = useState({
//     office_latitude: "",
//     office_longitude: "",
//     radius_km: "",
//     start_time: "",
//     late_time: "",
//     end_time: "",
//   });

//   const normalizeTime = (t) => {
//     if (!t) return "";
//     let s = String(t).trim().replace(/\./g, ":");
//     if (/^\d{1,2}:\d{2}$/.test(s)) s += ":00";
//     return s;
//   };

//   useEffect(() => {
//     api.get("/attendance-setting").then((res) => {
//       if (res.data) {
//         const data = res.data;
//         setForm({
//           ...data,
//           start_time: normalizeTime(data.start_time),
//           late_time: normalizeTime(data.late_time),
//           end_time: normalizeTime(data.end_time),
//         });
//       }
//     });
//   }, []);

//   const submit = async () => {
//     try {
//       const payload = {
//         ...form,
//         start_time: normalizeTime(form.start_time),
//         late_time: normalizeTime(form.late_time),
//         end_time: normalizeTime(form.end_time),
//       };
//       await api.post("/attendance-setting", payload);
//       alert("Pengaturan berhasil disimpan");
//     } catch {
//       alert("Gagal menyimpan pengaturan");
//     }
//   };

//   return (
//     <AdminLayout>
//       <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
//         <div className="max-w-4xl mx-auto">
//           {/* Header */}
//           <div className="mb-6">
//             <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
//               Pengaturan Absensi
//             </h1>
//             <p className="text-gray-500 mt-1 text-sm md:text-base">
//               Atur lokasi kantor dan jam absensi karyawan
//             </p>
//           </div>

//           {/* Card */}
//           <div className="bg-white rounded-2xl shadow p-6 md:p-8">
//             {/* Lokasi */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//               {[
//                 ["Latitude Kantor", "office_latitude"],
//                 ["Longitude Kantor", "office_longitude"],
//                 ["Radius (KM)", "radius_km"],
//               ].map(([label, key]) => (
//                 <div key={key}>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     {label}
//                   </label>
//                   <input
//                     type="text"
//                     value={form[key]}
//                     onChange={(e) =>
//                       setForm({ ...form, [key]: e.target.value })
//                     }
//                     className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                     placeholder={label}
//                   />
//                 </div>
//               ))}
//             </div>

//             {/* Waktu */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
//               {[
//                 ["Jam Buka", "start_time"],
//                 ["Batas Hadir", "late_time"],
//                 ["Jam Tutup", "end_time"],
//               ].map(([label, key]) => (
//                 <div key={key}>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     {label}
//                   </label>
//                   <input
//                     type="time"
//                     value={form[key]}
//                     onChange={(e) =>
//                       setForm({ ...form, [key]: e.target.value })
//                     }
//                     className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
//                   />
//                 </div>
//               ))}
//             </div>

//             {/* Action */}
//             <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
//               <button
//                 onClick={submit}
//                 className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition"
//               >
//                 Simpan Pengaturan
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </AdminLayout>
//   );
// }


// admin 
// 'use client';
// import AdminLayout from '@/components/Adminlayout';
// import { UserPlus, Mail, Lock, User } from 'lucide-react';
// import { useAuth } from '@/context/AuthContext';
// import { useState, useEffect } from 'react';
// import * as XLSX from 'xlsx';

// export default function AddUserForm() {
//   const { getAllUsers, createUser, updateUser, deleteUser } = useAuth();

//   const [users, setUsers] = useState([]);
//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     password: '',
//     role: 'karyawan',
//   });
//   const [editId, setEditId] = useState(null);

//   /* ===================== FETCH ===================== */
//   const fetchUsers = async () => {
//     try {
//       const data = await getAllUsers();
//       setUsers(data);
//     } catch (err) {
//       console.error('Gagal fetch user:', err);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   /* ===================== EXCEL ===================== */
//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     const reader = new FileReader();

//     reader.onload = async (event) => {
//       const workbook = XLSX.read(event.target.result, { type: 'binary' });
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const data = XLSX.utils.sheet_to_json(sheet);

//       for (const row of data) {
//         await createUser({
//           name: row.nama || row.name || '',
//           email: row.email || '',
//           password: row.password || '',
//           role: row.role || 'karyawan',
//         });
//       }

//       fetchUsers();
//       alert('Import Excel berhasil');
//     };

//     if (file) reader.readAsBinaryString(file);
//   };

//   /* ===================== FORM ===================== */
//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     editId ? await updateUser(editId, form) : await createUser(form);
//     setForm({ name: '', email: '', password: '', role: 'karyawan' });
//     setEditId(null);
//     fetchUsers();
//   };

//   const handleEdit = (u) => {
//     setForm({ name: u.name, email: u.email, password: '', role: u.role });
//     setEditId(u.id);
//   };

//   const handleDelete = async (id) => {
//     await deleteUser(id);
//     fetchUsers();
//   };

//   return (
//     <AdminLayout>
//       <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
//         <div className="max-w-6xl mx-auto">

//           {/* ===================== TITLE ===================== */}
//           <div className="text-center mb-8">
//             <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Pengguna</h1>
//             <p className="text-gray-600 text-sm">
//               Tambah, edit, hapus pengguna & import Excel
//             </p>
//           </div>

//           {/* ===================== FORM ===================== */}
//           <div className="bg-white rounded-xl shadow p-6 mb-10">
//             <div className="mb-6">
//               <label className="text-sm font-medium">Import Excel</label>
//               <input
//                 type="file"
//                 accept=".xlsx,.xls"
//                 onChange={handleFileUpload}
//                 className="mt-2 w-full text-sm"
//               />
//             </div>

//             <form
//               onSubmit={handleSubmit}
//               className="grid grid-cols-1 md:grid-cols-2 gap-6"
//             >
//               {/* Nama */}
//               <Input
//                 icon={<User className="text-blue-500" />}
//                 label="Nama"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//               />

//               {/* Email */}
//               <Input
//                 icon={<Mail className="text-green-500" />}
//                 label="Email"
//                 name="email"
//                 type="email"
//                 value={form.email}
//                 onChange={handleChange}
//               />

//               {/* Password */}
//               <Input
//                 icon={<Lock className="text-teal-500" />}
//                 label="Password"
//                 name="password"
//                 type="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 required={!editId}
//               />

//               {/* Role */}
//               <div>
//                 <label className="text-sm font-medium">Role</label>
//                 <select
//                   name="role"
//                   value={form.role}
//                   onChange={handleChange}
//                   className="w-full mt-2 p-3 border rounded-lg"
//                 >
//                   <option value="admin">Admin</option>
//                   <option value="karyawan">Karyawan</option>
//                 </select>
//               </div>

//               {/* Button */}
//               <div className="md:col-span-2">
//                 <button
//                   type="submit"
//                   className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//                 >
//                   {editId ? 'Update User' : 'Tambah User'}
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* ===================== USERS ===================== */}
//           <div className="bg-white rounded-xl shadow p-6">
//             <h2 className="text-xl font-bold mb-4">Daftar Pengguna</h2>

//             {/* Desktop Table */}
//             <div className="hidden md:block overflow-x-auto">
//               <table className="w-full border">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="p-3 text-left">Nama</th>
//                     <th className="p-3 text-left">Email</th>
//                     <th className="p-3">Role</th>
//                     <th className="p-3">Aksi</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {users.map((u) => (
//                     <tr key={u.id} className="border-t">
//                       <td className="p-3">{u.name}</td>
//                       <td className="p-3">{u.email}</td>
//                       <td className="p-3">{u.role}</td>
//                       <td className="p-3 space-x-2">
//                         <button
//                           onClick={() => handleEdit(u)}
//                           className="px-3 py-1 bg-yellow-400 text-white rounded"
//                         >
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => handleDelete(u.id)}
//                           className="px-3 py-1 bg-red-500 text-white rounded"
//                         >
//                           Hapus
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Mobile Card */}
//             <div className="md:hidden space-y-4">
//               {users.map((u) => (
//                 <div
//                   key={u.id}
//                   className="border rounded-lg p-4 shadow-sm"
//                 >
//                   <p className="font-semibold">{u.name}</p>
//                   <p className="text-sm text-gray-600">{u.email}</p>
//                   <p className="text-sm">Role: {u.role}</p>
//                   <div className="flex gap-2 mt-3">
//                     <button
//                       onClick={() => handleEdit(u)}
//                       className="flex-1 bg-yellow-400 text-white py-2 rounded"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(u.id)}
//                       className="flex-1 bg-red-500 text-white py-2 rounded"
//                     >
//                       Hapus
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//         </div>
//       </div>
//     </AdminLayout>
//   );
// }

// /* ===================== COMPONENT INPUT ===================== */
// function Input({
//   label,
//   icon,
//   name,
//   type = 'text',
//   value,
//   onChange,
//   required = true,
// }) {
//   return (
//     <div>
//       <label className="text-sm font-medium">{label}</label>
//       <div className="relative mt-2">
//         <div className="absolute left-3 top-3">{icon}</div>
//         <input
//           type={type}
//           name={name}
//           value={value}
//           onChange={onChange}
//           required={required}
//           className="w-full pl-10 p-3 border rounded-lg"
//         />
//       </div>
//     </div>
//   );
// }


// login
// "use client";

// import React from "react";
// import { useAuth } from "@/context/AuthContext";

// export default function LoginPage() {
//   const { login } = useAuth();

//   const [role, setRole] = React.useState("admin");
//   const [form, setForm] = React.useState({
//     email: "",
//     password: "",
//   });
//   const [error, setError] = React.useState("");
//   const [loading, setLoading] = React.useState(false);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await login({ ...form, role });
//     } catch (err) {
//       setError(
//         err?.response?.data?.message ||
//           err?.message ||
//           "Terjadi kesalahan saat login."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
//       {/* LOGIN CARD */}
//       <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8">

//         {/* LOGO */}
//         <div className="flex items-center justify-center mb-6">
//           <div className="bg-blue-600 p-3 rounded-xl mr-3">
//             <svg
//               className="w-7 h-7 text-white"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//               />
//             </svg>
//           </div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
//             AttendTrack
//           </h1>
//         </div>

//         <p className="text-center font-semibold text-gray-800">
//           Welcome Back
//         </p>
//         <p className="text-center text-gray-600 text-sm mb-6">
//           Sign in to access your attendance dashboard
//         </p>

//         {/* ROLE */}
//         <div className="mb-6">
//           <p className="text-center text-sm font-medium mb-3">Login As</p>
//           <div className="grid grid-cols-2 gap-4">
//             {[
//               { key: "admin", label: "Admin / HR", icon: "👔" },
//               { key: "karyawan", label: "Karyawan", icon: "👤" },
//             ].map((r) => (
//               <button
//                 key={r.key}
//                 type="button"
//                 onClick={() => setRole(r.key)}
//                 className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
//                   role === r.key
//                     ? "bg-blue-600 text-white border-blue-600 scale-105"
//                     : "bg-gray-50 border-gray-200 hover:bg-gray-100"
//                 }`}
//               >
//                 <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-3xl">
//                   {r.icon}
//                 </div>
//                 <span className="font-semibold text-sm">{r.label}</span>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* ERROR */}
//         {error && (
//           <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm text-center">
//             {error}
//           </div>
//         )}

//         {/* FORM */}
//         <form onSubmit={handleSubmit}>
//           {/* EMAIL */}
//           <div className="mb-4">
//             <label className="text-sm font-medium text-gray-700">
//               Email Address
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={form.email}
//               onChange={handleChange}
//               required
//               placeholder="your@email.com"
//               className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-50 focus:border-blue-600 focus:outline-none"
//             />
//           </div>

//           {/* PASSWORD */}
//           <div className="mb-6">
//             <label className="text-sm font-medium text-gray-700">
//               Password
//             </label>
//             <input
//               type="password"
//               name="password"
//               value={form.password}
//               onChange={handleChange}
//               required
//               placeholder="••••••••"
//               className="w-full mt-2 px-4 py-3 rounded-2xl border bg-gray-50 focus:border-blue-600 focus:outline-none"
//             />
//           </div>

//           {/* REMEMBER */}
//           <div className="flex items-center justify-between mb-6">
//             <label className="flex items-center gap-2 text-sm">
//               <input type="checkbox" className="rounded" />
//               Remember me
//             </label>
//             <a href="#" className="text-sm text-blue-600 hover:underline">
//               Forgot password?
//             </a>
//           </div>

//           {/* BUTTON */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-60"
//           >
//             {loading ? "Signing In..." : "Sign In"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
