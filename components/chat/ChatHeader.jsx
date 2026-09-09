'use client'

import { X, Headphones } from 'lucide-react'

const ChatHeader = ({ onClose }) => {
    return (
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl sm:rounded-t-2xl">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Headphones size={18} className="text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                        Our Store BD Support
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                        <span className="text-[10px] font-medium text-green-100">
                            অনলাইন — সাধারণত কয়েক মিনিটে উত্তর দেয়
                        </span>
                    </div>
                </div>
            </div>

            <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 transition text-white/80 hover:text-white"
                aria-label="Close chat"
            >
                <X size={18} />
            </button>
        </div>
    )
}

export default ChatHeader
