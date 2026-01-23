"use client";

import { useState, useRef, useEffect } from "react";
import useAuthMiddleware from "@/hooks/auth";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/axios";
import Notification from "@/components/Notification";
import * as faceapi from "@vladmandic/face-api";

export default function EmployeeHome() {
   useAuthMiddleware();
  const { logout, user } = useAuth();

  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isInRange, setIsInRange] = useState(true); // Default true until calculated
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLivenessVerified, setIsLivenessVerified] = useState(false);
  const [faceDetectionMessage, setFaceDetectionMessage] = useState("Memuat sensor wajah...");
  const [companies, setCompanies] = useState([]);
  const [currentAtCompany, setCurrentAtCompany] = useState(null);

  // State for today's attendance and monthly stats
  const [todayAttendance, setTodayAttendance] = useState({
    has_checked_in: false,
    check_in_time: null,
    status: null,
    location: null,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  });

  const [monthlyStats, setMonthlyStats] = useState({
    present: 0,
    late: 0,
    absent: 0
  });

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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionInterval = useRef(null);

  // ===== DISTANCE CALCULATION (Haversine Formula) =====
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // In meters
  };

  // ===== GPS & REVERSE GEOCODING =====
  const getLocation = async () => {
    // Set loading state if needed
    setAddress("Mencari lokasi...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ latitude: lat, longitude: lng });

        // Calculate distance against ALL companies
        if (companies.length > 0) {
          let foundInRange = false;
          let nearestComp = null;
          let minDistance = Infinity;

          companies.forEach(comp => {
            const officeLat = parseFloat(comp.latitude);
            const officeLng = parseFloat(comp.longitude);

            const dist = calculateDistance(
              officeLat,
              officeLng,
              lat,
              lng
            );

            if (dist <= comp.radius_km) {
              foundInRange = true;
              nearestComp = comp;
              setDistance(dist);
            }

            if (dist < minDistance) {
              minDistance = dist;
              if (!foundInRange) {
                nearestComp = comp;
                setDistance(dist);
              }
            }
          });

          setIsInRange(foundInRange);
          setCurrentAtCompany(nearestComp);
        } else if (user?.company) {
          const officeLat = parseFloat(user.company.latitude);
          const officeLng = parseFloat(user.company.longitude);

          const dist = calculateDistance(
            officeLat,
            officeLng,
            lat,
            lng
          );
          setDistance(dist);
          setIsInRange(dist <= user.company.radius_km);
          setCurrentAtCompany(user.company);
        }

        // Fetch alamat menggunakan Nominatim API (OpenStreetMap)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.display_name || "Lokasi tidak diketahui";
          setAddress(addr);
        } catch (error) {
          console.error("Gagal fetch alamat:", error);
          setAddress("Lokasi tidak diketahui");
        }
      },
      (err) => {
        let msg = "Izin lokasi ditolak";
        if (err.code === 1) msg = "Izin lokasi ditolak. Aktifkan GPS di browser.";
        else if (err.code === 2) msg = "Posisi tidak tersedia.";
        else if (err.code === 3) msg = "Waktu pencarian lokasi habis.";
        alert(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // PAKSA MENCARI TITIK BARU, JANGAN PAKAI CACHE
      }
    );
  };

  // ===== FACE API MODELS LOADING =====
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://vladmandic.github.io/face-api/model/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setIsModelsLoaded(true);
        setFaceDetectionMessage("Sensor wajah siap");
      } catch (error) {
        console.error("Error loading face-api models:", error);
        setFaceDetectionMessage("Gagal memuat sensor wajah");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch Today's Attendance
        const todayRes = await api.get('/attendance/today');
        if (todayRes.data) {
          setTodayAttendance(todayRes.data);
        }

        // Fetch Monthly Stats
        const statsRes = await api.get('/attendance/monthly-stats');
        if (statsRes.data) {
          setMonthlyStats(statsRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCompanies = async () => {
      try {
        const res = await api.get('/companies');
        if (res.data) {
          setCompanies(res.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchData();
    fetchCompanies();
    getLocation();
  }, [user]);

  // ===== START CAMERA =====
  const startSelfie = async () => {
    if (todayAttendance.has_checked_in) {
      showNotification("Anda telah absen hari ini.", "info");
      return;
    }
    setIsCapturing(true);
    setCapturedImage(null);
    await getLocation(); // Tunggu lokasi dan alamat selesai

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    videoRef.current.srcObject = stream;
    streamRef.current = stream;

    // Start face detection loop
    detectionInterval.current = setInterval(async () => {
      if (videoRef.current && !capturedImage) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        if (detections.length > 0) {
          const detection = detections[0];
          setIsFaceDetected(true);

          if (!isLivenessVerified) {
            const landmarks = detection.landmarks;
            const mouthInnerTop = landmarks.getMouth()[14]; // Point 62
            const mouthInnerBottom = landmarks.getMouth()[18]; // Point 66

            // Calculate distance
            const mouthDistance = Math.abs(mouthInnerBottom.y - mouthInnerTop.y);

            // Liveness Threshold (simple mouth opening detection)
            if (mouthDistance > 15) { // Threshold can be adjusted
              setIsLivenessVerified(true);
              setFaceDetectionMessage("Liveness terverifikasi! Silakan ambil foto.");
            } else {
              setFaceDetectionMessage("Silakan buka mulut Anda untuk verifikasi");
            }
          } else {
            setFaceDetectionMessage("Wajah terdeteksi");
          }
        } else {
          setIsFaceDetected(false);
          setIsLivenessVerified(false);
          setFaceDetectionMessage("Wajah tidak terdeteksi");
        }
      }
    }, 200);
  };

  // Fungsi untuk wrap teks panjang menjadi multiple lines
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && i > 0) {
        ctx.strokeText(line, x, currentY);
        ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.strokeText(line, x, currentY);
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight; // Return posisi Y berikutnya
  };

  // ===== TAKE PHOTO =====
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Tambahkan timestamp yang rapi (tanggal, jam, dan lokasi/alamat) dengan wrapping
    if (location && address) {
      const now = new Date();
      const tanggal = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      ctx.font = "bold 20px Arial"; // Ukuran dan style teks
      ctx.fillStyle = "white"; // Warna teks (putih agar terlihat di foto)
      ctx.strokeStyle = "black"; // Outline hitam untuk kontras
      ctx.lineWidth = 2;

      const maxWidth = canvas.width - 20; // Lebar maksimal teks (hindari overflow)
      const lineHeight = 25; // Jarak antar baris
      const x = 10; // Posisi horizontal
      let y = canvas.height - (lineHeight * 4); // Mulai dari bawah, sesuaikan untuk 3-4 baris

      // Tampilkan Tanggal
      ctx.strokeText(`Tanggal: ${tanggal}`, x, y);
      ctx.fillText(`Tanggal: ${tanggal}`, x, y);
      y += lineHeight;

      // Tampilkan Jam
      ctx.strokeText(`Jam: ${jam}`, x, y);
      ctx.fillText(`Jam: ${jam}`, x, y);
      y += lineHeight;

      // Tampilkan Lokasi dengan wrapping jika panjang
      ctx.strokeText(`Lokasi:`, x, y);
      ctx.fillText(`Lokasi:`, x, y);
      y += lineHeight;
      wrapText(ctx, address, x, y, maxWidth, lineHeight);
    } else {
      alert("Lokasi atau alamat belum tersedia. Coba lagi.");
      return;
    }

    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));

    // Stop detection loop once photo is taken
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
  };

  // ===== STOP CAMERA =====
  const closeSelfie = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
    setIsCapturing(false);
    setCapturedImage(null);
    setIsFaceDetected(false);
    setIsLivenessVerified(false);
    setAddress(null); // Reset alamat
  };

  const submitCheckIn = async () => {
    if (!capturedImage || !location) {
      alert("Foto / lokasi belum lengkap");
      return;
    }

    try {
      const response = await api.post("/attendance/checkin", {
        photo: capturedImage,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const data = response.data;
      console.log('checkin response', data);

      showNotification(data.message, "success");
      closeSelfie();

      // Refresh data after successful check-in
      try {
        const todayRes = await api.get('/attendance/today');
        setTodayAttendance(todayRes.data);

        const statsRes = await api.get('/attendance/monthly-stats');
        setMonthlyStats(statsRes.data);
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Gagal mengirim check-in";
      const debugInfo = error.response?.data?.debug ? '\nDebug: ' + JSON.stringify(error.response.data.debug) : '';
      showNotification(errorMessage + debugInfo, "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Notification */}
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2.5 rounded-2xl mr-3 shadow-lg shadow-blue-100">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">AttendTrack</h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">


            <div className="flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100">
              <div className="bg-blue-600 text-white w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-black text-xs md:text-sm shadow-md">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden xs:block">
                <p className="font-bold text-gray-900 text-xs md:text-sm leading-none mb-0.5">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-500 font-medium">{user?.role || 'Karyawan'}</p>
              </div>
              <button onClick={logout} className="p-1 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Welcome Message */}
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
            Halo, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h2>
          <p className="text-gray-500 font-medium mt-1">Siap untuk mulai bekerja hari ini?</p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
          {/* Left Column - Check-In Card (Wider) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white p-6 md:p-10 h-full flex flex-col items-center justify-center relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-100 group-hover:scale-150 duration-700"></div>

              <div className="relative z-10 flex flex-col items-center text-center w-full">
                {/* Visual Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse"></div>
                  <div className="bg-blue-600 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl shadow-blue-200 relative">
                    <svg className="w-16 h-16 md:w-20 md:h-20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm-2 8h8v8H3v-8zm2 2v4h4v-4H5zm8-12v8h8V3h-8zm6 6h-4V5h4v4zm-6 4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm0-4h2v2h-2v-2zm-4 0h2v2h-2v-2z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Presensi Kehadiran</h3>
                <p className="text-gray-400 font-medium mb-8 max-w-sm">Pastikan Anda berada di area kantor untuk melakukan check-in</p>

                {currentAtCompany && (
                  <div className={`mb-8 p-6 rounded-[1.5rem] border-2 transition-all w-full max-w-md ${isInRange ? 'bg-green-50/50 border-green-100 text-green-800 shadow-sm' : 'bg-red-50/50 border-red-100 text-red-800 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isInRange ? 'bg-green-600 text-white' : 'bg-red-600 text-white shadow-lg shadow-red-200'}`}>
                          <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isInRange ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                          </svg>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none">{isInRange ? 'Dalam Area' : 'Luar Area'}</p>
                      </div>
                      <button
                        onClick={getLocation}
                        className="text-[10px] bg-white px-3 py-1.5 rounded-xl border border-gray-100 font-black uppercase tracking-wider hover:bg-gray-50 active:scale-95 transition shadow-sm"
                      >
                        Refresh GPS
                      </button>
                    </div>

                    <div className="space-y-1 text-left">
                      <p className="text-sm font-black tracking-tight">{currentAtCompany.name}</p>
                      {distance !== null && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${isInRange ? 'bg-green-600' : 'bg-red-600'}`}
                              style={{ width: `${Math.min(100, (distance / currentAtCompany.radius_km) * 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 min-w-fit">{Math.round(distance)}m / {currentAtCompany.radius_km}m</p>
                        </div>
                      )}
                    </div>

                    {!isInRange && location && (
                      <div className="mt-4 pt-4 border-t border-red-100/50">
                        <div className="grid grid-cols-2 gap-4 text-[9px] uppercase font-bold tracking-widest text-red-400">
                          <div>
                            <p className="mb-0.5">Lokasi Anda</p>
                            <p className="text-red-900">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                          </div>
                          <div>
                            <p className="mb-0.5">Lokasi Kantor Terdekat</p>
                            <p className="text-red-900">{currentAtCompany.latitude}, {currentAtCompany.longitude}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={startSelfie}
                  disabled={!isInRange || todayAttendance.has_checked_in || !isModelsLoaded}
                  className={`px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all w-full max-w-sm shadow-xl ${(!isInRange || todayAttendance.has_checked_in || !isModelsLoaded)
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-300 hover:shadow-blue-400 active:scale-98'
                    }`}
                >
                  {todayAttendance.has_checked_in
                    ? 'Anda Telah Absen'
                    : !isModelsLoaded ? 'Memuat Sensor...' : !isInRange ? 'Luar Area Kantor' : 'Mulai Absensi Sekarang'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Status Cards */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Today's Status Card */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white p-6 md:p-8">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
                Status Hari Ini
              </h3>

              <div className="space-y-6">
                {/* Check-in Time */}
                <div className="flex items-center group">
                  <div className="bg-blue-50 p-4 rounded-2xl mr-4 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Check-in</p>
                    <p className="font-black text-gray-900 text-lg">
                      {todayAttendance.has_checked_in ? todayAttendance.check_in_time : '--:--'}
                    </p>
                  </div>
                  {todayAttendance.has_checked_in && (
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${todayAttendance.status === 'HADIR' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                      {todayAttendance.status === 'HADIR' ? 'Hadir' : 'Telat'}
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center group">
                  <div className="bg-gray-50 p-4 rounded-2xl mr-4 group-hover:bg-gray-100 transition-colors">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Lokasi Presensi</p>
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {todayAttendance.has_checked_in ? todayAttendance.location : 'Belum absen'}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center group">
                  <div className="bg-gray-50 p-4 rounded-2xl mr-4 group-hover:bg-gray-100 transition-colors">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tanggal</p>
                    <p className="font-bold text-gray-900 text-sm">{todayAttendance.date}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Stats Card - Fixed responsiveness for smaller screens */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-2xl shadow-blue-200 p-8 text-white relative overflow-hidden group">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

              <h3 className="text-lg font-black mb-8 relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistik Bulan Ini
              </h3>

              <div className="grid grid-cols-3 gap-2 relative z-10">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl py-4 transition hover:bg-white/20">
                  <p className="text-2xl md:text-3xl font-black mb-1">{monthlyStats.present}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Hadir</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl py-4 transition hover:bg-white/20">
                  <p className="text-2xl md:text-3xl font-black mb-1">{monthlyStats.late}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Telat</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl py-4 transition hover:bg-white/20 text-red-100">
                  <p className="text-2xl md:text-3xl font-black mb-1">{monthlyStats.absent}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Alpa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Camera Modal - Modernized & Responsive */}
      {isCapturing && (
        <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
              <span className="font-black text-sm uppercase tracking-[0.2em]">Verifikasi Identitas</span>
              <button onClick={closeSelfie} className="p-1 hover:bg-white/10 rounded-lg transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 md:p-8 bg-gray-50 flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] bg-black rounded-[2rem] overflow-hidden shadow-inner border-4 border-white">
                {!capturedImage ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                ) : (
                  <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                )}
                {/* Overlay guides */}
                {!capturedImage && (
                  <div className="absolute inset-0 border-[3rem] border-black/10 flex items-center justify-center pointer-events-none">
                    <div className={`w-48 h-64 border-2 border-dashed rounded-full transition-colors duration-500 ${isLivenessVerified ? 'border-green-400 bg-green-400/10' : 'border-white/50'}`}></div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full">
                {!capturedImage ? (
                  <>
                    <button
                      onClick={takePhoto}
                      disabled={!isLivenessVerified}
                      className={`px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex-1 ${!isLivenessVerified ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 hover:scale-105 active:scale-95'}`}
                    >
                      Ambil Foto
                    </button>
                    <button
                      onClick={closeSelfie}
                      className="bg-gray-100 text-gray-500 px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all flex-1"
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="bg-orange-100 text-orange-600 px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-orange-200 transition-all flex-1"
                    >
                      Ulangi Foto
                    </button>
                    <button
                      onClick={submitCheckIn}
                      className="bg-green-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-200 flex-1 hover:scale-105 active:scale-95"
                    >
                      Kirim Sekarang
                    </button>
                  </>
                )}
              </div>
              <div className={`mt-4 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${isLivenessVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {isLivenessVerified && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {faceDetectionMessage}
              </div>
              <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Data lokasi & waktu akan direkam otomatis pada foto</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
