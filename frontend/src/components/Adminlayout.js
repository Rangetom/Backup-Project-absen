"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";


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
      href: "/dashboard", label: "Dashboard", icon: (
        <svg className="w-5 h-5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3" />
        </svg>
      )
    },
    {
      href: "/attendance-report", label: "Attendance Reports", icon: (
        <svg className="w-5 h-5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10V4M5 21h14" />
        </svg>
      )
    },
    {
      href: "/companies", label: "Companies", icon: (
        <svg className="w-5 h-5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      href: "/admin", label: "Admin", icon: (
        <svg className="w-5 h-5 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3m6 0c0 1.657 1.343 3 3 3s3-1.343 3-3M12 11V7m0 0a4 4 0 014 4v1a4 4 0 01-8 0v-1a4 4 0 014-4z" />
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-2 md:hidden text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">AttendTrack</h1>
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Search (Hidden on small mobile) */}


            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 hover:bg-gray-100 rounded-full px-2 py-1 md:px-3 md:py-2 transition"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-medium text-gray-800 text-sm leading-tight">{user?.name || 'Admin HR'}</p>
                  <p className="text-xs text-gray-500">{user?.role || 'Officer'}</p>
                </div>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border z-50">
                  <div className="p-5 border-b">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <a href="#" className="block px-5 py-3 hover:bg-gray-50 text-gray-700">Profile Settings</a>
                    <a href="#" className="block px-5 py-3 hover:bg-gray-50 text-gray-700">Change Password</a>
                  </div>
                  <div className="border-t">
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50 flex items-center">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16 h-full">
        {/* Sidebar Backdrop (Mobile only) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:sticky left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white shadow-lg transition-transform duration-300 z-30
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="mt-8 px-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition ${pathname === link.href
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  }`}
              >
                {link.icon}
                <span className="font-medium text-sm tracking-wide">{link.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-h-[calc(100vh-120px)]">
          {children}
        </main>
      </div>

      {/* Footer */}

    </div>
  );
}