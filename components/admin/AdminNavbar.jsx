'use client'
import Link from "next/link"
import { LogOutIcon } from "lucide-react"

const AdminNavbar = ({ onLogout }) => {
    return (
        <div className="flex items-center justify-between px-6 sm:px-12 py-3 border-b border-slate-200 transition-all bg-white">
            <Link href="/" className="relative text-3xl sm:text-4xl font-semibold text-slate-700">
                <span className="text-green-600">go</span>cart<span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-4">
                <p className="text-xs sm:text-sm font-medium text-slate-600 hidden sm:block">
                    idrisrashel@gmail.com
                </p>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs sm:text-sm rounded-lg transition border border-slate-200 font-medium"
                    title="Logout Admin"
                >
                    <LogOutIcon size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}

export default AdminNavbar