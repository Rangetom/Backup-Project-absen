"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/Adminlayout";
import api from "@/utils/axios";
import dynamic from 'next/dynamic';
import "leaflet/dist/leaflet.css";
import useAuthMiddleware from "@/hooks/auth";
import Notification from "@/components/Notification";
import { X, Building2, Clock, MapPin, Target, Timer, Map as MapIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

// Dynamic import for Map to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const useMapEvents = dynamic(
    () => import('react-leaflet').then((mod) => mod.useMapEvents),
    { ssr: false }
);
const Circle = dynamic(
    () => import('react-leaflet').then((mod) => mod.Circle),
    { ssr: false }
);

// Search Control Component (SS2 Safe)
const MapSearchControl = dynamic(
    () => import('@/components/MapSearchControl'),
    { ssr: false }
);

// Fix Leaflet marker icon issue
import L from 'leaflet';
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    const eventHandlers = {
        dragend(e) {
            const marker = e.target;
            if (marker != null) {
                setPosition(marker.getLatLng());
            }
        },
    };

    return position === null ? null : (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            icon={icon}
        >
        </Marker>
    );
}

export default function CompaniesPage() {
    useAuthMiddleware();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

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

    // Form State
    const [form, setForm] = useState({
        name: "",
        latitude: -6.200000, // Default Jakarta
        longitude: 106.816666,
        radius_km: 100,
        time_in: "08:00",
        time_late: "08:15",
        time_out: "17:00",
    });

    // Map Position State
    const [mapPosition, setMapPosition] = useState({ lat: -6.200000, lng: 106.816666 });

    useEffect(() => {
        fetchCompanies();
    }, []);

    // Update form when map position changes
    useEffect(() => {
        setForm(prev => ({
            ...prev,
            latitude: mapPosition.lat,
            longitude: mapPosition.lng
        }));
    }, [mapPosition]);

    const fetchCompanies = async () => {
        try {
            const res = await api.get("/companies");
            setCompanies(res.data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/companies/${editId}`, form);
                showNotification("Company updated successfully!", "success");
            } else {
                await api.post("/companies", form);
                showNotification("Company created successfully!", "success");
            }
            setShowModal(false);
            fetchCompanies();
        } catch (error) {
            console.error(error);
            showNotification("Operation failed", "error");
        }
    };

    // Excel handlers
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet);

                for (const row of data) {
                    const companyData = {
                        name: row['nama kantor'] || row.nama || row.name || '',
                        latitude: parseFloat(row.latitude) || 0,
                        longitude: parseFloat(row.longitude) || 0,
                        radius_km: parseInt(row['radius meter'] || row.radius || row.radius_km) || 100,
                        time_in: row['jam masuk'] || row.time_in || "08:00",
                        time_late: row['batas telat'] || row.time_late || "08:15",
                        time_out: row['jam pulang'] || row.time_out || "17:00",
                    };

                    try {
                        await api.post("/companies", companyData);
                    } catch (err) {
                        console.error(`Gagal menambahkan kantor ${companyData.name}:`, err);
                    }
                }

                showNotification("Data kantor dari Excel telah berhasil diimpor.");
                fetchCompanies();
            } catch (error) {
                console.error('Error saat memproses file:', error);
                showNotification("Gagal memproses file Excel.", "error");
            }
        };

        if (file) {
            reader.readAsBinaryString(file);
        }
    };

    const downloadTemplate = () => {
        const data = [
            {
                "nama kantor": "Kantor Pusat Jakarta",
                "latitude": -6.200000,
                "longitude": 106.816666,
                "radius meter": 100,
                "jam masuk": "08:00",
                "batas telat": "08:15",
                "jam pulang": "17:00"
            },
            {
                "nama kantor": "Culinary Pro",
                "latitude": -6.175110,
                "longitude": 106.827170,
                "radius meter": 150,
                "jam masuk": "09:00",
                "batas telat": "09:30",
                "jam pulang": "18:00"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "template_import_kantor.xlsx");
        showNotification("Template berhasil diunduh.");
    };

    const handleEdit = (company) => {
        setIsEditing(true);
        setEditId(company.id);
        setForm({
            name: company.name,
            latitude: parseFloat(company.latitude),
            longitude: parseFloat(company.longitude),
            radius_km: company.radius_km,
            time_in: company.time_in, // Assuming API returns HH:mm:ss, input type="time" handles it usually
            time_late: company.time_late,
            time_out: company.time_out,
        });
        setMapPosition({ lat: parseFloat(company.latitude), lng: parseFloat(company.longitude) });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this company?")) {
            try {
                await api.delete(`/companies/${id}`);
                showNotification("Company deleted successfully!", "success");
                fetchCompanies();
            } catch (error) {
                console.error(error);
                showNotification("Delete failed", "error");
            }
        }
    };

    const openAddModal = () => {
        setIsEditing(false);
        setEditId(null);
        setForm({
            name: "",
            latitude: -6.200000,
            longitude: 106.816666,
            radius_km: 100,
            time_in: "08:00",
            time_late: "08:15",
            time_out: "17:00",
        });
        setMapPosition({ lat: -6.200000, lng: 106.816666 });
        setShowModal(true);
    };

    return (
        <AdminLayout>
            <Notification
                show={notification.show}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(prev => ({ ...prev, show: false }))}
            />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Kantor</h2>
                        <p className="text-slate-500 font-bold text-sm mt-1">Kelola data cabang dan titik lokasi presensi Magau Tracker</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 transition active:scale-95 group"
                        >
                            <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Tambah Kantor
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest border border-emerald-100 transition cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import Excel
                        </button>
                    </div>
                </div>

                {/* Companies Table Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 overflow-hidden relative">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Daftar Cabang</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {companies.length} Lokasi Aktif</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Nama Kantor</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Jam Kerja</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Radius Aman</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-base shadow-inner group-hover:bg-blue-600 group-hover:text-white group-hover:-rotate-12 transition-all duration-500">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-none mb-1">{company.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Office ID #{company.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                                                </div>
                                                <span className="text-sm font-bold tracking-tight">{company.time_in} - {company.time_out}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    {company.radius_km} <span className="opacity-60">Meter</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(company)}
                                                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90 shadow-sm hover:shadow-md bg-white border border-slate-100"
                                                    title="Edit Lokasi"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(company.id)}
                                                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90 shadow-sm hover:shadow-md bg-white border border-slate-100"
                                                    title="Hapus Kantor"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {companies.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center opacity-40">
                                                <Building2 className="w-16 h-16 text-slate-300 mb-4" />
                                                <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Belum ada data kantor</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal - Modern & Integrated Leaflet */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row">
                        {/* Map View Side - Left */}
                        <div className="w-full md:w-1/2 bg-slate-100 h-64 md:h-auto relative">
                            <MapContainer
                                center={[mapPosition.lat, mapPosition.lng]}
                                zoom={15}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <MapSearchControl setPosition={setMapPosition} />
                                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                                <Circle
                                    center={mapPosition}
                                    radius={Number(form.radius_km)}
                                    pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2 }}
                                />
                            </MapContainer>
                            <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg text-white">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Koordinat Terpilih</p>
                                    <p className="text-xs font-black text-slate-900">
                                        {mapPosition.lat.toFixed(6)}, {mapPosition.lng.toFixed(6)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Side - Right */}
                        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar max-h-[90vh]">
                            {/* Header */}
                            <div className="bg-blue-600 p-8 relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">Konfigurasi Cabang</p>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">
                                    {isEditing ? "Ubah Data Kantor" : "Tambah Kantor Baru"}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-6 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition active:scale-95 z-20"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Form Input */}
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nama Branch Kantor</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            className="text-slate-900 block w-full pl-14 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                            placeholder="Contoh: Kantor Pusat Jakarta"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Latitude</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="number"
                                                step="any"
                                                className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                                                value={form.latitude}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setForm({ ...form, latitude: val });
                                                    setMapPosition(prev => ({ ...prev, lat: val }));
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Longitude</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="number"
                                                step="any"
                                                className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                                                value={form.longitude}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setForm({ ...form, longitude: val });
                                                    setMapPosition(prev => ({ ...prev, lng: val }));
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Jam Masuk</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="time"
                                                className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold text-xs"
                                                value={form.time_in}
                                                onChange={(e) => setForm({ ...form, time_in: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Batas Telat</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Timer className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="time"
                                                className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold text-xs"
                                                value={form.time_late}
                                                onChange={(e) => setForm({ ...form, time_late: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Jam Pulang</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="time"
                                                className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold text-xs"
                                                value={form.time_out}
                                                onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between ml-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radius Presensi</label>
                                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                                            <input
                                                type="number"
                                                value={form.radius_km}
                                                onChange={(e) => setForm({ ...form, radius_km: parseInt(e.target.value) || 0 })}
                                                className="bg-transparent border-none p-0 w-16 text-blue-600 font-black text-sm focus:ring-0"
                                            />
                                            <span className="text-[10px] font-black text-blue-600/60 uppercase">Meter</span>
                                        </div>
                                    </div>
                                    <div className="relative h-12 flex items-center bg-slate-50 rounded-2xl px-6">
                                        <input
                                            type="range"
                                            min="10"
                                            max="1000"
                                            step="10"
                                            className="w-full accent-blue-600 h-1.5 rounded-full"
                                            value={form.radius_km}
                                            onChange={(e) => setForm({ ...form, radius_km: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition active:scale-95"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-200 transition active:scale-95"
                                    >
                                        {isEditing ? "Aktualisasi Data" : "Daftarkan Kantor"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-100 p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 relative text-slate-900 border border-slate-100">
                        {/* Header */}
                        <div className="bg-emerald-600 p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.3em] mb-1 relative z-10">Bulk Import Kantor</p>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">Import Data Kantor</h3>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition active:scale-95 z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Instructions */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Petunjuk Pengisian</h4>
                                <p className="text-sm text-slate-600 font-bold leading-relaxed">
                                    Gunakan format file Excel yang telah ditentukan. Pastikan koordinat latitude dan longitude benar.
                                </p>
                                <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                                    <table className="w-full text-left text-[10px] text-slate-600">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">nama kantor</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">latitude</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">longitude</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">radius meter</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">jam masuk</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">batas telat</th>
                                                <th className="px-4 py-3 font-black uppercase tracking-wider text-slate-400">jam pulang</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-slate-50 bg-white">
                                                <td className="px-4 py-3 font-bold">Kantor Pusat</td>
                                                <td className="px-4 py-3 font-bold">-6.200000</td>
                                                <td className="px-4 py-3 font-bold">106.816666</td>
                                                <td className="px-4 py-3 font-bold">100</td>
                                                <td className="px-4 py-3 font-bold">08:00</td>
                                                <td className="px-4 py-3 font-bold">08:15</td>
                                                <td className="px-4 py-3 font-bold">17:00</td>
                                            </tr>
                                            <tr className="bg-slate-50/30">
                                                <td className="px-4 py-3 font-bold text-blue-600">Culinary Pro</td>
                                                <td className="px-4 py-3 font-bold">-6.175110</td>
                                                <td className="px-4 py-3 font-bold">106.827170</td>
                                                <td className="px-4 py-3 font-bold">150</td>
                                                <td className="px-4 py-3 font-bold">09:00</td>
                                                <td className="px-4 py-3 font-bold">09:30</td>
                                                <td className="px-4 py-3 font-bold">18:00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center justify-center gap-3 p-5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-2xl font-black text-xs uppercase tracking-widest transition active:scale-95 border border-blue-100"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Unduh Contoh File
                                </button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="excel-upload-kantor"
                                        accept=".xlsx, .xls"
                                        onChange={(e) => {
                                            handleFileUpload(e);
                                            setIsImportModalOpen(false);
                                        }}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="excel-upload-kantor"
                                        className="flex h-full items-center justify-center gap-3 p-5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest transition cursor-pointer active:scale-95 shadow-xl shadow-emerald-200/50"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Unggah File Excel
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
