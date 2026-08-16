'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"
import AdminLoginForm from "./AdminLoginForm"

const AdminLayout = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    const checkAdminAuth = () => {
        const isAuth = localStorage.getItem('adminAuthenticated') === 'true'
        setIsAdmin(isAuth)
        setLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('adminAuthenticated')
        setIsAdmin(false)
    }

    useEffect(() => {
        checkAdminAuth()
    }, [])

    if (loading) return <Loading />

    if (!isAdmin) {
        return <AdminLoginForm onLoginSuccess={() => setIsAdmin(true)} />
    }

    return (
        <div className="flex flex-col h-screen">
            <AdminNavbar onLogout={handleLogout} />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <AdminSidebar />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default AdminLayout