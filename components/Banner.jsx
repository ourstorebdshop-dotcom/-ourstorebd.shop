'use client'
import React from 'react'
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { dismissBanner } from '@/lib/features/banner/bannerSlice';
import { useRouter } from 'next/navigation';
import { XIcon } from 'lucide-react';

// Map gradient class names to actual CSS gradients for inline style
const gradientMap = {
    'from-violet-500 via-[#9938CA] to-[#E0724A]': 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)',
    'from-rose-500 via-pink-500 to-orange-500': 'linear-gradient(to right, #f43f5e, #ec4899, #f97316)',
    'from-blue-600 via-blue-500 to-cyan-400': 'linear-gradient(to right, #2563eb, #3b82f6, #22d3ee)',
    'from-emerald-600 via-green-500 to-teal-400': 'linear-gradient(to right, #059669, #22c55e, #2dd4bf)',
    'from-indigo-600 via-purple-500 to-pink-500': 'linear-gradient(to right, #4f46e5, #a855f7, #ec4899)',
    'from-slate-800 via-slate-700 to-slate-600': 'linear-gradient(to right, #1e293b, #334155, #475569)',
    'from-amber-500 via-orange-500 to-red-500': 'linear-gradient(to right, #f59e0b, #f97316, #ef4444)',
    'from-cyan-400 via-blue-500 to-indigo-600': 'linear-gradient(to right, #22d3ee, #3b82f6, #4f46e5)',
};

export default function Banner() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { banners, dismissedBanners } = useSelector(state => state.banner);

    // Get the highest priority active banner that hasn't been dismissed
    const activeBanner = banners
        .filter(b => b.isActive && !dismissedBanners.includes(b.id))
        .filter(b => {
            // Check date range if set
            const now = new Date();
            if (b.startDate && new Date(b.startDate) > now) return false;
            if (b.endDate && new Date(b.endDate) < now) return false;
            return true;
        })
        .sort((a, b) => a.priority - b.priority)[0];

    if (!activeBanner) return null;

    const copyToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback for HTTP / non-secure contexts (mobile over local network)
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        document.body.removeChild(textarea);
        return Promise.resolve();
    };

    const handleAction = () => {
        if (activeBanner.couponCode) {
            copyToClipboard(activeBanner.couponCode);
            toast.success(`Coupon "${activeBanner.couponCode}" copied to clipboard!`);
            dispatch(dismissBanner(activeBanner.id));
        } else if (activeBanner.linkUrl) {
            dispatch(dismissBanner(activeBanner.id));
            router.push(activeBanner.linkUrl);
        }
    };

    const handleDismiss = () => {
        dispatch(dismissBanner(activeBanner.id));
    };

    // Build background style using inline styles for reliability
    const bgStyle = {};
    if (activeBanner.bgType === 'gradient' && activeBanner.bgGradient) {
        bgStyle.background = gradientMap[activeBanner.bgGradient] || 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)';
    } else if (activeBanner.bgType === 'solid') {
        bgStyle.backgroundColor = activeBanner.bgColor || '#7c3aed';
    } else {
        bgStyle.background = 'linear-gradient(to right, #8b5cf6, #9938CA, #E0724A)';
    }
    bgStyle.color = activeBanner.textColor || '#ffffff';

    const hasClickAction = activeBanner.couponCode || activeBanner.linkUrl;

    return (
        <div
            className="w-full px-4 sm:px-6 py-2 sm:py-2.5 font-medium text-xs sm:text-sm"
            style={bgStyle}
        >
            <div className='flex items-center justify-between max-w-7xl mx-auto'>
                <p
                    className={`flex-1 text-left line-clamp-1 ${hasClickAction && !activeBanner.buttonText ? 'cursor-pointer hover:underline' : ''}`}
                    onClick={hasClickAction && !activeBanner.buttonText ? handleAction : undefined}
                >{activeBanner.message}</p>
                <div className="flex items-center space-x-2 sm:space-x-4 ml-2 sm:ml-4 shrink-0">
                    {activeBanner.buttonText && (
                        <button
                            onClick={handleAction}
                            type="button"
                            className="font-normal text-gray-800 bg-white hover:bg-gray-100 active:scale-95 px-3 sm:px-5 py-1.5 rounded-full transition text-[10px] sm:text-xs whitespace-nowrap"
                        >
                            {activeBanner.buttonText}
                        </button>
                    )}
                    <button
                        onClick={handleDismiss}
                        type="button"
                        className="p-0.5 rounded hover:bg-white/20 transition"
                    >
                        <XIcon size={16} style={{ color: activeBanner.textColor || '#ffffff' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}