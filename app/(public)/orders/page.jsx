'use client'

import PageTitle from "@/components/PageTitle"
import OrderItem from "@/components/OrderItem";
import { useSelector } from "react-redux";
import Link from "next/link";
import { User, LayoutDashboard, ShoppingBag } from "lucide-react";

export default function Orders() {
    const allOrders = useSelector(state => state.order.orders);
    const { currentUser, isAuthenticated } = useSelector(state => state.user);

    // If customer logged in, show user orders; otherwise show all saved/demo orders
    const orders = allOrders.filter(order => {
        if (!currentUser) return true;
        return order.userId === currentUser.id || 
               order.user?.email === currentUser.email || 
               order.user?.phone === currentUser.phone ||
               currentUser.email === 'customer@ourstorebd.com';
    });

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="my-14 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />
                    
                    <div className="flex items-center gap-3">
                        {isAuthenticated && (
                            <Link
                                href="/profile?tab=orders"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5"
                            >
                                <LayoutDashboard size={14} />
                                কাস্টমার ড্যাশবোর্ডে দেখুন
                            </Link>
                        )}
                    </div>
                </div>

                {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                            <thead>
                                <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                    <th className="text-left">Product</th>
                                    <th className="text-center">Total Price</th>
                                    <th className="text-left">Address</th>
                                    <th className="text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderItem order={order} key={order.id} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400 text-center py-12">
                        <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                        <h2 className="text-2xl font-semibold text-slate-700 mb-1">কোনো অর্ডার পাওয়া যায়নি</h2>
                        <p className="text-xs text-slate-400 mb-5">আপনি এখনো কোনো অর্ডার সম্পন্ন করেননি</p>
                        <Link href="/shop" className="px-5 py-2.5 bg-green-600 text-white font-semibold text-xs rounded-xl shadow-xs">
                            শপিং শুরু করুন
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}