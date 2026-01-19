// src/app/admin/page.jsx
'use client';
import AdminLayout from '@/components/Adminlayout';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '@/utils/axios'; // Add api import
import Swal from 'sweetalert2';
import useAuthMiddleware from '@/hooks/auth';


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

        Swal.fire({
          icon: 'success',
          title: 'Import Berhasil!',
          text: 'Data pengguna dari Excel telah berhasil diimpor.',
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true
        });
        fetchUsers();
      } catch (error) {
        console.error('Error saat memproses file:', error);
        Swal.fire({
          icon: 'error',
          title: 'Import Gagal',
          text: 'Gagal memproses file Excel. Pastikan format kolom sudah benar.',
        });
      }
    };

    if (file) {
      reader.readAsBinaryString(file);
    }
  };

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  const { user, getAllUsers, createUser, updateUser, deleteUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]); // Add companies state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "karyawan",
    company_id: "", // Add company_id to form
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

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
    fetchUsers();
    fetchCompanies(); // Fetch companies on mount
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
        Toast.fire({
          icon: 'success',
          title: 'User berhasil diperbarui'
        });
      } else {
        await createUser(form);
        Toast.fire({
          icon: 'success',
          title: 'User berhasil ditambahkan'
        });
      }
      closeForm();
      fetchUsers();
    } catch (err) {
      console.error("Gagal simpan user:", err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Simpan',
        text: 'Terjadi kesalahan saat menyimpan data pengguna.'
      });
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
        Toast.fire({
          icon: 'success',
          title: 'User telah dihapus'
        });
      } catch (err) {
        console.error("Gagal hapus user:", err);
        Swal.fire({
          icon: 'error',
          title: 'Gagal Hapus',
          text: 'Terjadi kesalahan saat menghapus data pengguna.'
        });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h2>
              <p className="mt-1 text-sm text-gray-600">Kelola data seluruh karyawan dan admin di sini</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="file"
                  id="excel-upload"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="excel-upload"
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-bold text-sm transition cursor-pointer border border-green-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Import Excel
                </label>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-blue-200 active:scale-95"
              >
                <UserPlus className="h-5 w-5" />
                Tambah Pengguna
              </button>
            </div>
          </div>

          {/* Tabel Data User */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Daftar Pengguna</h3>
              <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                Total: {users.length} User
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b">
                    <th className="px-8 py-5">Nama Pengguna</th>
                    <th className="px-8 py-5">Email</th>
                    <th className="px-8 py-5">Akses/Role</th>
                    <th className="px-8 py-5">Penempatan Kantor</th>
                    <th className="px-8 py-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-4 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">ID: #{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-gray-600 font-medium text-sm">{u.email}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-bold text-sm">
                            {companies.find(c => c.id === u.company_id)?.name || 'Pusat (Global)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-90"
                            title="Edit User"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-90"
                            title="Hapus User"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <User className="w-10 h-10" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Belum ada data pengguna</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Form Tambah/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="bg-blue-600 text-white p-6 md:p-8 flex items-center justify-between">
              <div>
                <span className="font-black text-xs uppercase tracking-[0.2em] opacity-80 block mb-1">
                  {editId ? "Ubah Data" : "Pendaftaran"}
                </span>
                <h3 className="text-xl font-black tracking-tight uppercase">
                  {editId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </h3>
              </div>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 md:p-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-gray-300">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="text-gray-900 block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Karyawan</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="text-gray-900 block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                        placeholder="email@kantor.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="text-gray-900 block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold"
                        placeholder="••••••••"
                        required={!editId}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Hak Akses (Role)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="text-gray-900 block w-full pl-12 pr-10 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold appearance-none cursor-pointer"
                        required
                      >
                        <option value="karyawan">Karyawan</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kantor Penempatan</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-blue-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <select
                        name="company_id"
                        value={form.company_id || ""}
                        onChange={handleChange}
                        className="text-gray-900 block w-full pl-12 pr-10 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 transition font-bold appearance-none cursor-pointer"
                        required
                      >
                        <option value="" disabled>-- Pilih Kantor --</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-8 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] flex justify-center items-center gap-2 py-5 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-200 transition active:scale-95"
                  >
                    {editId ? "Simpan Perubahan" : "Daftarkan Sekarang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}