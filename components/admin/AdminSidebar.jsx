'use client'

import { usePathname } from "next/navigation"
import { useSelector } from "react-redux"
import { HomeIcon, SquarePlusIcon, SquarePenIcon, LayoutListIcon, TicketPercentIcon, MegaphoneIcon, UsersIcon, MessageSquareIcon, Grid3X3Icon, TruckIcon, CircleDollarSignIcon, KeyRoundIcon } from "lucide-react"
import Link from "next/link"
import { getLocalMonthStr } from "@/lib/features/cashflow/cashflowSlice"

const AdminSidebar = ({ isMobileBottomNav = false }) => {

    const pathname = usePathname()
    const messages = useSelector(state => state.contact?.messages) || []
    const unreadCount = messages.filter(m => m.status === 'NEW').length

    // API settings status
    const googleAuth = useSelector(state => state.apiSettings?.googleAuth)
    const isGoogleConfigured = Boolean(googleAuth?.clientId?.trim())

    // Cash Flow Budget alert badge count
    const cashflowTransactions = useSelector(state => state.cashflow?.transactions) || []
    const cashflowBudgets = useSelector(state => state.cashflow?.budgets) || []
    const currentMonthStr = getLocalMonthStr()
    const monthExpensesByCategory = cashflowTransactions
        .filter(t => t.type === 'EXPENSE' && t.date && t.date.startsWith(currentMonthStr))
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + (t.amount || 0)
            return acc
        }, {})
    const budgetAlertsCount = cashflowBudgets.filter(b => {
        const spent = monthExpensesByCategory[b.categoryName] || 0
        return b.limit > 0 && spent >= (b.limit * (b.alertThreshold || 80) / 100)
    }).length

    const sidebarLinks = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        { name: 'Cash Flow', href: '/admin/cash-flow', icon: CircleDollarSignIcon, badge: budgetAlertsCount },
        { name: 'Add Product', href: '/admin/add-product', icon: SquarePlusIcon },
        { name: 'Manage Products', href: '/admin/manage-product', icon: SquarePenIcon },
        { name: 'Categories', href: '/admin/categories', icon: Grid3X3Icon },
        { name: 'Orders', href: '/admin/orders', icon: LayoutListIcon },
        { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
        { name: 'Messages', href: '/admin/contact', icon: MessageSquareIcon, badge: unreadCount },
        { name: 'Coupons', href: '/admin/coupons', icon: TicketPercentIcon },
        { name: 'Banners', href: '/admin/banners', icon: MegaphoneIcon },
        { name: 'Shipping', href: '/admin/shipping', icon: TruckIcon },
        { name: 'API Settings', href: '/admin/api-settings', icon: KeyRoundIcon, statusDot: !isGoogleConfigured ? 'amber' : 'green' },
    ]

    // Mobile bottom navigation bar
    if (isMobileBottomNav) {
        return (
            <div className="flex items-center overflow-x-auto no-scrollbar px-1 py-1.5 gap-0.5">
                {sidebarLinks.map((link, index) => (
                    <Link 
                        key={index} 
                        href={link.href} 
                        className={`relative flex flex-col items-center justify-center min-w-[60px] px-2 py-1.5 rounded-lg text-[10px] transition ${
                            pathname === link.href 
                                ? 'text-green-600 bg-green-50 font-semibold' 
                                : 'text-slate-500 active:bg-slate-50'
                        }`}
                    >
                        <link.icon size={18} />
                        <span className="mt-0.5 whitespace-nowrap">{link.name.split(' ')[0]}</span>
                        {link.badge > 0 && (
                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                        {link.statusDot && !link.badge && (
                            <span className={`absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full ${link.statusDot === 'green' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        )}
                    </Link>
                ))}
            </div>
        )
    }

    // Desktop sidebar
    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 min-w-60">
            <div className="flex flex-col gap-3 justify-center items-center pt-8">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl font-bold">A</div>
                <p className="text-slate-700 font-medium">Hi, Admin</p>
            </div>

            <div className="space-y-0.5">
                {
                    sidebarLinks.map((link, index) => (
                        <Link 
                            key={index} 
                            href={link.href} 
                            className={`relative flex items-center justify-between text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 text-slate-700 font-medium'}`}
                        >
                            <div className="flex items-center gap-3">
                                <link.icon size={18} className="ml-5" />
                                <p>{link.name}</p>
                            </div>
                            {link.badge > 0 && (
                                <span className="mr-5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                    {link.badge}
                                </span>
                            )}
                            {link.statusDot && !link.badge && (
                                <span className={`mr-5 w-2 h-2 rounded-full ${link.statusDot === 'green' ? 'bg-emerald-500' : 'bg-amber-400'}`} title={link.statusDot === 'green' ? 'API Configured' : 'API Setup Pending'} />
                            )}
                            {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1.5 rounded-l"></span>}
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default AdminSidebar