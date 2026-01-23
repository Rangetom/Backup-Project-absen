// src/app/admin/page.jsx
'use client';
import AdminLayout from '@/components/Adminlayout';
import { UserPlus, Mail, Lock, User, Building2, X, UserCog, Search, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '@/utils/axios'; // Add api import
import Swal from 'sweetalert2';
import useAuthMiddleware from '@/hooks/auth';
import Notification from '@/components/Notification';


export default function AddUserForm() {
  useAuthMiddleware();

  //excel
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
          const userData = {
            name: row.nama || row.name || '',
            email: row.email || '',
            password: row.password || '',
            role: row.role || 'karyawan',
            company_id: row.company_id || null, // Handle import with company if needed
          };

          try {
            await createUser(userData);
          } catch (err) {
            console.error(`Gagal menambahkan user ${userData.name}:`, err);
          }
        }

        showNotification("Data pengguna dari Excel telah berhasil diimpor.");
        fetchUsers();
      } catch (error) {
        console.error('Error saat memproses file:', error);
        showNotification("Gagal memproses file Excel. Pastikan format kolom sudah benar.", "error");
      }
    };

    if (file) {
      reader.readAsBinaryString(file);
    }
  };



  const { user, getAllUsers, createUser, updateUser, deleteUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]); // Add companies state
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
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "karyawan",
    company_id: "", // Add company_id to form
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Gagal fetch data user:", err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error("Gagal fetch companies:", err);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchUsers(), fetchCompanies()]);
    };
    fetchInitialData();
  }, []);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setEditId(null);
    setForm({ name: "", email: "", password: "", role: "karyawan", company_id: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateUser(editId, form);
        showNotification("User berhasil diperbarui");
      } else {
        await createUser(form);
        showNotification("User berhasil ditambahkan");
      }
      closeForm();
      fetchUsers();
    } catch (err) {
      console.error("Gagal simpan user:", err);
      showNotification("Terjadi kesalahan saat menyimpan data pengguna.", "error");
    }
  };

  const handleEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      company_id: u.company_id || "" // Populate company_id
    });
    setEditId(u.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data pengguna ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        fetchUsers();
        showNotification("User telah dihapus");
      } catch (err) {
        console.error("Gagal hapus user:", err);
        showNotification("Terjadi kesalahan saat menghapus data pengguna.", "error");
      }
    }
  };

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <Notification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
      />

      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">Kelola data karyawan dan akses sistem AttendTrack</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditId(null);
                setForm({ name: "", email: "", password: "", role: "karyawan", company_id: "" });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 transition active:scale-95 group"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Tambah User
            </button>
            <div className="relative">
              <input
                type="file"
                id="excel-upload-main"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="excel-upload-main"
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest border border-emerald-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Excel
              </label>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold text-sm text-slate-900 placeholder:text-slate-300"
            />
          </div>
          <div className="relative min-w-[200px] group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold text-sm text-slate-900 appearance-none cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="karyawan">Karyawan</option>
              <option value="magang">Magang</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Improved Users Table Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 overflow-hidden relative">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Daftar Karyawan</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {filteredUsers.length} USER</span>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Informasi User</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Role & Akses</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">Kantor</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right">Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-base shadow-inner group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-300">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1">{u.name}</p>
                          <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'magang' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">
                          {companies.find(c => c.id === u.company_id)?.name || u.company?.name || "Global / Tidak Ada"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90 shadow-sm hover:shadow-md bg-white border border-slate-100"
                          title="Edit User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90 shadow-sm hover:shadow-md bg-white border border-slate-100"
                          title="Hapus User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <User className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">
                          {searchQuery || roleFilter !== "all" ? "Data tidak ditemukan" : "Belum ada data pengguna"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-blue-600 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">Pendaftaran System</p>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight relative z-10">
                {editId ? "Ubah Data Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button
                onClick={closeForm}
                className="absolute top-6 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition active:scale-95 z-20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nama Lengkap</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    className="text-slate-900 block w-full pl-14 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                      value={form.password}
                      onChange={handleChange}
                      required={!editId}
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Role</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <select
                      name="role"
                      className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold appearance-none cursor-pointer"
                      value={form.role}
                      onChange={handleChange}
                    >
                      <option value="karyawan">Karyawan</option>
                      <option value="magang">Magang</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kantor</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <select
                      name="company_id"
                      className="text-slate-900 block w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold appearance-none cursor-pointer"
                      value={form.company_id || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>-- Pilih Kantor --</option>
                      {companies?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-200 transition active:scale-95"
                >
                  {editId ? "Simpan Perubahan" : "Daftarkan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}