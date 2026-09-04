'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import ThankYouModal from "@/components/ThankYouModal";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳';
    
    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);
    const { currentUser } = useSelector(state => state.user);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [placedOrder, setPlacedOrder] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState({
        name: currentUser?.name || '',
        phone: currentUser?.phone || '',
        address: (currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0])?.street || '',
        location: 'insideDhaka'
    });

    useEffect(() => {
        if (currentUser) {
            setDeliveryInfo(prev => ({
                ...prev,
                name: prev.name || currentUser.name || '',
                phone: prev.phone || currentUser.phone || '',
                address: prev.address || (currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0])?.street || '',
            }));
        }
    }, [currentUser]);

    const createCartArray = () => {
        let total = 0;
        const cartArray = [];
        for (const [key, value] of Object.entries(cartItems)) {
            const product = products.find(product => product.id === key);
            if (product) {
                const qty = typeof value === 'number' ? value : value.quantity;
                const color = typeof value === 'object' ? value.color : null;
                const size = typeof value === 'object' ? value.size : null;
                cartArray.push({
                    ...product,
                    quantity: qty,
                    selectedColor: color,
                    selectedSize: size,
                });
                total += product.price * qty;
            }
        }
        setCartArray(cartArray);
        setTotalPrice(total);
    }

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }))
    }

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return (
        <>
            {cartArray.length > 0 ? (
                <div className="min-h-screen mx-4 sm:mx-6 text-slate-800">

                    <div className="max-w-7xl mx-auto ">
                        {/* Title */}
                        <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" path="/shop" />

                        <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                            <table className="w-full max-w-4xl text-slate-600 table-auto text-sm">
                                <thead>
                                    <tr className="text-xs sm:text-sm">
                                        <th className="text-left">Product</th>
                                        <th>Quantity</th>
                                        <th>Total Price</th>
                                        <th className="max-md:hidden">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        cartArray.map((item, index) => (
                                            <tr key={index} className="space-x-2">
                                                <td className="flex gap-3 my-4">
                                                    <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                                                        <Image src={item.images[0]} className="h-14 w-auto" alt={item.name} width={45} height={45} />
                                                    </div>
                                                    <div>
                                                        <p className="max-sm:text-sm">{item.name}</p>
                                                        <p className="text-xs text-slate-500">{item.category}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p>{currency}{item.price}</p>
                                                            {item.selectedColor && (
                                                                <span className="w-4 h-4 rounded-full border border-slate-300 inline-block" style={{ backgroundColor: item.selectedColor }} title={item.selectedColor} />
                                                            )}
                                                            {item.selectedSize && (
                                                                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.selectedSize}</span>
                                                            )}
                                                        </div>
                                                        <button onClick={() => handleDeleteItemFromCart(item.id)} className="md:hidden text-red-500 text-xs mt-1 hover:bg-red-50 px-2 py-0.5 rounded transition-all">
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <Counter productId={item.id} />
                                                </td>
                                                <td className="text-center">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                                                <td className="text-center max-md:hidden">
                                                    <button onClick={() => handleDeleteItemFromCart(item.id)} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                                        <Trash2Icon size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>

                            <OrderSummary 
                                totalPrice={totalPrice} 
                                items={cartArray} 
                                deliveryInfo={deliveryInfo} 
                                setDeliveryInfo={setDeliveryInfo} 
                                onOrderSuccess={(order) => setPlacedOrder(order)}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-[80vh] mx-4 sm:mx-6 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
                    <p className="text-sm text-slate-400">আপনার কার্টে কোনো পণ্য নেই</p>
                    <a href="/shop" className="mt-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
                        শপিং শুরু করুন
                    </a>
                </div>
            )}

            {/* Thank You Popup Modal */}
            {placedOrder && (
                <ThankYouModal 
                    order={placedOrder} 
                    onClose={() => setPlacedOrder(null)} 
                />
            )}
        </>
    )
}