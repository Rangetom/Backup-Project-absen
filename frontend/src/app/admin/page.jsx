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
      setForm({ name: "", email: "", password: "", role: "karyawan", company_id: "" });
      setEditId(null);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Tambah Pengguna Baru</h2>
            <p className="mt-2 text-sm text-gray-600">Isi data pengguna di bawah ini</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">

            {/* excel */}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import Data dari Excel
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Format Excel: Kolom harus memiliki header nama, email, role, dan password (opsional)
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="text-black block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-green-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className=" text-black block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="contoh@email.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-teal-500" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    required={!editId}
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-indigo-500" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className=" text-black block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none bg-white"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="karyawan">Karyawan</option>
                  </select>
                </div>
              </div>

              {/* Company Dropdown */}
              <div>
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Kantor / Perusahaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <select
                    id="company_id"
                    name="company_id"
                    value={form.company_id || ""}
                    onChange={handleChange}
                    className="text-black block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition appearance-none bg-white"
                  >
                    <option value="">-- Pilih Kantor --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tombol Tambah */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg shadow-md transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                >
                  <UserPlus className="h-5 w-5" />
                  {editId ? "Update Pengguna" : "Tambah Pengguna"}
                </button>
              </div>
            </form>
          </div>

          {/* Tabel Data User */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Daftar Pengguna</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="text-black bg-gray-100">
                    <th className="border p-2 text-left">Nama</th>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Kantor</th>
                    <th className="border p-2 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="text-black border p-2">{u.name}</td>
                      <td className="text-black border p-2">{u.email}</td>
                      <td className="text-black border p-2">{u.role}</td>
                      <td className="text-black border p-2">
                        {companies.find(c => c.id === u.company_id)?.name || '-'}
                      </td>
                      <td className="text-black border p-2 space-x-2">
                        <button
                          className=" bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium px-3 py-1 rounded hover:bg-yellow-500 transition"
                          onClick={() => handleEdit(u)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                          onClick={() => handleDelete(u.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}