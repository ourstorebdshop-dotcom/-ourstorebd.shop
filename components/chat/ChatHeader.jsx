'use client'

import { X, Headphones } from 'lucide-react'
import { useSelector } from 'react-redux'

const ChatHeader = ({ onClose }) => {
    const shipping = useSelector(state => state.shipping)
    const quickContact = shipping?.quickContact || {}
    const isWaEnabled = quickContact.whatsapp?.enabled !== false
    const isCallEnabled = quickContact.call?.enabled !== false

    // Format WhatsApp number
    const rawWa = quickContact.whatsapp?.number || '01577272145'
    let cleanWa = rawWa.replace(/[^0-9]/g, '')
    if (cleanWa.startsWith('01') && cleanWa.length === 11) {
        cleanWa = '88' + cleanWa
    }
    const waMessage = quickContact.whatsapp?.message || 'হ্যালো, আমি কিছু জানতে চাইছিলাম।'

    // Format Call number
    const rawCall = quickContact.call?.number || '01577272145'
    const cleanCall = rawCall.replace(/[^0-9]/g, '')

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

            {/* Right side: WhatsApp + Call + Close */}
            <div className="flex items-center gap-1.5">
                {isWaEnabled && (
                    <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(waMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp এ মেসেজ করুন"
                        className="p-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95
                            transition-all duration-150 text-white flex items-center justify-center shadow-sm"
                        aria-label="WhatsApp"
                    >
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                    </a>
                )}

                {isCallEnabled && (
                    <a
                        href={`tel:${cleanCall}`}
                        title="কল করুন"
                        className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95
                            transition-all duration-150 text-white flex items-center justify-center shadow-sm"
                        aria-label="কল করুন"
                    >
                        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                    </a>
                )}

                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/25 transition text-white/80 hover:text-white"
                    aria-label="Close chat"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}

export default ChatHeader
