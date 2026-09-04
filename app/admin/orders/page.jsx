'use client'

import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import toast from "react-hot-toast"
import { updateOrderStatus as setOrderStatusRedux, deleteOrder as removeOrderRedux } from "@/lib/features/order/orderSlice"
import { 
    SearchIcon, 
    Trash2Icon, 
    EyeIcon, 
    XIcon, 
    ShoppingBagIcon, 
    CheckCircle2Icon, 
    ClockIcon, 
    TruckIcon, 
    PackageCheckIcon,
    XCircleIcon
} from "lucide-react"

export default function AdminOrders() {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const dispatch = useDispatch()
    const orders = useSelector(state => state.order.orders)

    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [deletingOrderId, setDeletingOrderId] = useState(null)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    const handleUpdateOrderStatus = (orderId, newStatus) => {
        dispatch(setOrderStatusRedux({ orderId, status: newStatus }))
        toast.success(`Order status updated to ${newStatus}`)
    }

    const confirmDeleteOrder = () => {
        dispatch(removeOrderRedux(deletingOrderId))
        toast.success("Order deleted successfully!")
        setDeletingOrderId(null)
    }

    const openModal = (orderId) => {
        setSelectedOrder(orderId)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setSelectedOrder(null)
        setIsModalOpen(false)
    }

    // Always read fresh order data from Redux store
    const modalOrder = isModalOpen && selectedOrder
        ? orders.find(o => o.id === selectedOrder)
        : null


    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
                              (order.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
                              (order.id || "").toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status) => {
        switch (status) {
            case "DELIVERED":
                return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold inline-flex items-center gap-1"><CheckCircle2Icon size={13} /> DELIVERED</span>
            case "SHIPPED":
                return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold inline-flex items-center gap-1"><TruckIcon size={13} /> SHIPPED</span>
            case "PROCESSING":
                return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold inline-flex items-center gap-1"><ClockIcon size={13} /> PROCESSING</span>
            case "CANCELLED":
                return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold inline-flex items-center gap-1"><XCircleIcon size={13} /> CANCELLED</span>
            default:
                return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold inline-flex items-center gap-1"><PackageCheckIcon size={13} /> ORDER PLACED</span>
        }
    }

    return (
        <div className="text-slate-700 mb-28 max-w-6xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
                    All <span className="text-green-600">Orders</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage customer orders, track delivery status, and inspect order details
                </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs">
                <div className="relative w-full sm:w-80">
                    <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by customer name, email..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <XIcon size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                    {["ALL", "ORDER_PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                                statusFilter === status
                                    ? "bg-slate-800 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {status === "ALL" ? "All Orders" : status.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        No orders match your filter criteria.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5">#</th>
                                    <th className="px-4 py-3.5">Customer</th>
                                    <th className="px-4 py-3.5">Total Amount</th>
                                    <th className="px-4 py-3.5">Payment</th>
                                    <th className="px-4 py-3.5">Coupon</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5">Date</th>
                                    <th className="px-4 py-3.5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order, index) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                                        onClick={() => openModal(order.id)}
                                    >
                                        <td className="px-4 py-4 font-bold text-green-600">
                                            {index + 1}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-800">{order.user?.name}</p>
                                            <p className="text-xs text-slate-400">{order.user?.email}</p>
                                        </td>
                                        <td className="px-4 py-4 font-bold text-slate-800">
                                            {currency}{Number(order.total).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                                                {order.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {order.isCouponUsed ? (
                                                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-mono font-semibold">
                                                    {order.coupon?.code}
                                                </span>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                className="border border-slate-200 rounded-lg text-xs py-1.5 px-2 font-medium bg-white focus:ring-2 focus:ring-green-100 outline-none"
                                            >
                                                <option value="ORDER_PLACED">ORDER PLACED</option>
                                                <option value="PROCESSING">PROCESSING</option>
                                                <option value="SHIPPED">SHIPPED</option>
                                                <option value="DELIVERED">DELIVERED</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-400">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openModal(order.id)}
                                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <EyeIcon size={17} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingOrderId(order.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete Order"
                                                >
                                                    <Trash2Icon size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ORDER DETAILS MODAL */}
            {isModalOpen && modalOrder && (
                <div onClick={closeModal} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={closeModal} className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                            <XIcon size={20} />
                        </button>

                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Order Details</h2>
                                <p className="text-xs text-slate-400">ID: {modalOrder.id}</p>
                            </div>
                            {getStatusBadge(modalOrder.status)}
                        </div>

                        {/* Customer & Address Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl mb-4 text-xs">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">Customer Info</h3>
                                <p><strong className="text-slate-700">Name:</strong> {modalOrder.user?.name}</p>
                                <p><strong className="text-slate-700">Email:</strong> {modalOrder.user?.email}</p>
                                <p><strong className="text-slate-700">Phone:</strong> {modalOrder.address?.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">Shipping Address</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {modalOrder.address?.street}, {modalOrder.address?.city}, {modalOrder.address?.state} {modalOrder.address?.zip}, {modalOrder.address?.country}
                                </p>
                            </div>
                        </div>

                        {/* Ordered Items */}
                        <div className="mb-4">
                            <h3 className="font-semibold text-slate-800 mb-3 text-sm">Ordered Products</h3>
                            <div className="space-y-2">
                                {modalOrder.orderItems.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 bg-white">
                                        <img
                                            src={item.product?.images?.[0]?.src || item.product?.images?.[0]}
                                            alt={item.product?.name}
                                            className="w-14 h-14 object-cover rounded-lg border border-slate-100 shrink-0"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800 text-sm">{item.product?.name}</p>
                                            <p className="text-xs text-slate-400">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right font-bold text-slate-800 text-sm">
                                            {currency}{Number(item.price).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary & Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-sm">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500">Payment: <span className="font-bold text-slate-700">{modalOrder.paymentMethod}</span></p>
                                <p className="text-xs text-slate-500">Order Date: <span className="text-slate-700">{new Date(modalOrder.createdAt).toLocaleDateString()}</span></p>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs text-slate-500">Status:</span>
                                    <select
                                        value={modalOrder.status}
                                        onChange={(e) => handleUpdateOrderStatus(modalOrder.id, e.target.value)}
                                        className="border border-slate-200 rounded-lg text-xs py-1 px-2 font-medium bg-white focus:ring-2 focus:ring-green-100 outline-none"
                                    >
                                        <option value="ORDER_PLACED">ORDER PLACED</option>
                                        <option value="PROCESSING">PROCESSING</option>
                                        <option value="SHIPPED">SHIPPED</option>
                                        <option value="DELIVERED">DELIVERED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Total Amount</p>
                                <p className="text-2xl font-bold text-green-600">{currency}{Number(modalOrder.total).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingOrderId && (
                <div onClick={() => setDeletingOrderId(null)} className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2Icon size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Delete Order?</h3>
                        {(() => {
                            const delOrder = orders.find(o => o.id === deletingOrderId)
                            return delOrder ? (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Customer:</span>
                                        <span className="font-semibold text-slate-800">{delOrder.user?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Amount:</span>
                                        <span className="font-bold text-green-600">{currency}{Number(delOrder.total).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status:</span>
                                        <span className="font-semibold">{delOrder.status?.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            ) : null
                        })()}
                        <p className="text-sm text-slate-500 mt-3">
                            Are you sure you want to delete this order?
                        </p>

                        <div className="flex gap-3 justify-center mt-6">
                            <button
                                onClick={() => setDeletingOrderId(null)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteOrder}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition shadow-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
