'use client'
import Image from "next/image";
import { DotIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳';
    const [ratingModal, setRatingModal] = useState(null);

    const { ratings } = useSelector(state => state.rating);

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {(order.orderItems || []).map((item, index) => {
                            const itemImg = item.product?.images?.[0] || item.product?.image || '/placeholder.svg';
                            const itemName = item.product?.name || 'Product';
                            const prodId = item.product?.id;

                            return (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md">
                                        <Image
                                            className="h-14 w-auto object-contain"
                                            src={itemImg}
                                            alt={itemName}
                                            width={50}
                                            height={50}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center text-sm">
                                        <p className="font-medium text-slate-600 text-base">{itemName}</p>
                                        <p>{currency}{item.price} Qty : {item.quantity} </p>
                                        {(item.color || item.size) && (
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {item.color && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-500">
                                                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" style={{ backgroundColor: item.color }} />
                                                    </span>
                                                )}
                                                {item.size && (
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.size}</span>
                                                )}
                                            </div>
                                        )}
                                        <p className="mb-1">{order.createdAt ? new Date(order.createdAt).toDateString() : ''}</p>
                                        <div>
                                            {prodId && ratings.find(rating => order.id === rating.orderId && prodId === rating.productId)
                                                ? <Rating value={ratings.find(rating => order.id === rating.orderId && prodId === rating.productId).rating} />
                                                : <button onClick={() => setRatingModal({ orderId: order.id, productId: prodId })} className={`text-green-500 hover:bg-green-50 transition ${order.status !== "DELIVERED" && 'hidden'}`}>Rate Product</button>
                                            }
                                        </div>
                                        {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </td>

                <td className="text-center max-md:hidden">{currency}{order.total}</td>

                <td className="text-left max-md:hidden">
                    <p>{order.address?.name ? `${order.address.name}, ` : ''}{order.address?.street ? `${order.address.street},` : ''}</p>
                    <p>{[order.address?.city, order.address?.state, order.address?.zip, order.address?.country].filter(Boolean).join(', ')}</p>
                    <p>{order.address?.phone || ''}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <div
                        className={`flex items-center justify-center gap-1 rounded-full p-1 ${order.status === 'PROCESSING'
                            ? 'text-yellow-500 bg-yellow-100'
                            : order.status === 'DELIVERED'
                                ? 'text-green-500 bg-green-100'
                                : order.status === 'SHIPPED'
                                    ? 'text-blue-500 bg-blue-100'
                                    : 'text-slate-500 bg-slate-100'
                            }`}
                    >
                        <DotIcon size={10} className="scale-250" />
                        {(order.status || 'PENDING').split('_').join(' ').toLowerCase()}
                    </div>
                </td>
            </tr>
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={4}>
                    <p>{order.address?.name ? `${order.address.name}, ` : ''}{order.address?.street || ''}</p>
                    <p>{[order.address?.city, order.address?.state, order.address?.zip, order.address?.country].filter(Boolean).join(', ')}</p>
                    <p>{order.address?.phone || ''}</p>
                    <br />
                    <div className="flex items-center">
                        <span className='text-center mx-auto px-6 py-1.5 rounded bg-green-100 text-green-700' >
                            {(order.status || 'PENDING').replace(/_/g, ' ').toLowerCase()}
                        </span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem