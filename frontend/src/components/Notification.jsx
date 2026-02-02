"use client";

import React from "react";

export default function Notification({ show, message, type, onClose }) {
    return (
        <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 transition-all duration-500 transform ${show ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0 pointer-events-none"
                }`}
        >
            <div
                className={`flex items-center p-4 rounded-2xl shadow-2xl min-w-[320px] max-w-md border backdrop-blur-md ${type === "success"
                    ? "bg-green-500/90 border-green-400 text-white"
                    : (type === "info" || type === "progress")
                        ? "bg-blue-500/90 border-blue-400 text-white"
                        : type === "warning"
                            ? "bg-orange-500/90 border-orange-400 text-white"
                            : "bg-red-500/90 border-red-400 text-white"
                    }`}
            >
                <div className="mr-4 bg-white/20 p-2 rounded-xl">
                    {type === "success" && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {(type === "info" || type === "progress") && (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {type === "warning" && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    {(type !== "success" && type !== "info" && type !== "progress" && type !== "warning") && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                </div>
                <div className="flex-1 mr-4">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5">
                        {type === "success" ? "Berhasil" : (type === "info" || type === "progress") ? "Menunggu" : type === "warning" ? "Peringatan" : "Gagal"}
                    </p>
                    <p className="font-bold text-sm leading-tight">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
