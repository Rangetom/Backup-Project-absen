"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Building2,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Settings,
  Lock,
  Calendar
} from 'lucide-react';


export default function AdminLayout({ children }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />
    },
    {
      href: "/attendance-report",
      label: "Laporan Absensi",
      icon: <FileText className="w-5 h-5 mr-3" />
    },
    {
      href: "/companies",
      label: "Daftar Kantor",
      icon: <Building2 className="w-5 h-5 mr-3" />
    },
    {
      href: "/admin",
      label: "Manajemen User",
      icon: <UserCog className="w-5 h-5 mr-3" />
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 md:hidden text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">AttendTrack</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all active:scale-95 shadow-sm"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-slate-900 text-xs leading-none mb-1">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user?.role || 'Administrator'}</p>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                  <div className="p-6 bg-slate-50/50 flex flex-col items-center border-b border-slate-100">
                    <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-xl mb-4">
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                    </div>
                    <p className="font-black text-slate-900 text-center">{user?.name}</p>
                    <p className="text-xs text-slate-400 font-medium text-center mt-1">{user?.email}</p>
                  </div>
                  <div className="py-3 px-3">
                    <button className="w-full flex items-center px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold group">
                      <div className="p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-white transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      Pengaturan Profil
                    </button>
                    <button className="w-full flex items-center px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold group">
                      <div className="p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-white transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      Ganti Password
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-black group"
                    >
                      <div className="p-2 bg-red-100/50 rounded-lg mr-3 group-hover:bg-white transition-colors text-red-600">
                        <LogOut className="w-4 h-4" />
                      </div>
                      Keluar Sesi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        {/* Sidebar Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Improved Sidebar */}
        <aside className={`
          fixed md:sticky left-0 top-20 h-[calc(100vh-80px)] w-72 bg-white/50 border-r border-slate-100 transition-all duration-300 z-[45] custom-scrollbar
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="px-6 py-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-4">Main Menu</p>
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group
                      ${isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50"
                        : "text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-sm"}
                    `}
                  >
                    <div className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"} transition-colors`}>
                      {link.icon}
                    </div>
                    <span className="font-black text-[13px] tracking-tight flex-1">{link.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Modern Main Content Area */}
        <main className="flex-1 p-4 md:p-10 max-w-[1600px] mx-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
