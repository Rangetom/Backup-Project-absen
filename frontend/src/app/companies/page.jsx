"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/Adminlayout";
import api from "@/utils/axios";
import dynamic from 'next/dynamic';
import "leaflet/dist/leaflet.css";
import useAuthMiddleware from "@/hooks/auth";
import Notification from "@/components/Notification";

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
                onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
            />
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Company Management</h1>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        + Add Company
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Location (Lat, Lng)</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Work Hours</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Radius</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {companies.map((company) => (
                                <tr key={company.id} className="hover:bg-gray-50">
                                    <td className="text-black px-6 py-4 font-medium">{company.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {Number(company.latitude).toFixed(4)}, {Number(company.longitude).toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {company.time_in} - {company.time_out}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{company.radius_km} meters</td>
                                    <td className="px-6 py-4 space-x-2">
                                        <button
                                            onClick={() => handleEdit(company)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {companies.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No companies found. Create one checking in.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {isEditing ? "Edit Company" : "Add New Company"}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Form Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                            placeholder="e.g. Kantor Pusat Jakarta"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Entry Time</label>
                                            <input
                                                type="time"
                                                step="1"
                                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={form.time_in}
                                                onChange={(e) => setForm({ ...form, time_in: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Late Time</label>
                                            <input
                                                type="time"
                                                step="1"
                                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={form.time_late}
                                                onChange={(e) => setForm({ ...form, time_late: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Exit Time</label>
                                            <input
                                                type="time"
                                                step="1"
                                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={form.time_out}
                                                onChange={(e) => setForm({ ...form, time_out: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Radius (Meters)</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={form.radius_km}
                                                onChange={(e) => setForm({ ...form, radius_km: e.target.value })}
                                                required
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                                        <p className="font-semibold mb-2">Selected Location:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-600 block">Latitude</label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    className="w-full border rounded px-2 py-1 text-sm"
                                                    value={form.latitude}
                                                    onChange={(e) => {
                                                        const lat = parseFloat(e.target.value);
                                                        setForm({ ...form, latitude: lat });
                                                        setMapPosition({ ...mapPosition, lat: lat });
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600 block">Longitude</label>
                                                <input
                                                    type="number"
                                                    step="0.000001"
                                                    className="w-full border rounded px-2 py-1 text-sm"
                                                    value={form.longitude}
                                                    onChange={(e) => {
                                                        const lng = parseFloat(e.target.value);
                                                        setForm({ ...form, longitude: lng });
                                                        setMapPosition({ ...mapPosition, lng: lng });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs opacity-75">Click on map or drag marker to adjust.</p>
                                    </div>
                                </div>

                                {/* Right: Map Selector */}
                                <div className="h-80 lg:h-auto min-h-[300px] bg-gray-100 rounded-xl overflow-hidden border">
                                    <MapContainer
                                        center={[mapPosition.lat, mapPosition.lng]}
                                        zoom={13}
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
                                            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
                                        />
                                    </MapContainer>
                                </div>

                                <div className="col-span-1 lg:col-span-2 pt-4 border-t flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                                    >
                                        {isEditing ? "Save Changes" : "Create Company"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
