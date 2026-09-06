'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ productId }) => {

    const { cartItems } = useSelector(state => state.cart);

    const dispatch = useDispatch();

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
    }

    const item = cartItems[productId];
    const qty = typeof item === 'number' ? item : (item?.quantity || 1);

    const removeFromCartHandler = () => {
        if (qty <= 1) return;
        dispatch(removeFromCart({ productId }))
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1 rounded-lg border border-slate-300 bg-white shadow-xs max-sm:text-sm text-slate-700">
            <button
                type="button"
                onClick={removeFromCartHandler}
                disabled={qty <= 1}
                title={qty <= 1 ? 'সর্বনিম্ন পরিমাণ ১' : 'পরিমাণ কমান'}
                className={`size-7 flex items-center justify-center rounded-md font-bold transition-all select-none ${
                    qty <= 1
                        ? 'text-slate-300 cursor-not-allowed opacity-40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 active:scale-90 cursor-pointer'
                }`}
                aria-label="Decrease quantity"
            >
                -
            </button>
            <p className="px-2 font-bold text-slate-800 min-w-[28px] text-center select-none">
                {qty}
            </p>
            <button
                type="button"
                onClick={addToCartHandler}
                className="size-7 flex items-center justify-center rounded-md font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 active:scale-90 transition-all select-none cursor-pointer"
                aria-label="Increase quantity"
            >
                +
            </button>
        </div>
    )
}

export default Counter