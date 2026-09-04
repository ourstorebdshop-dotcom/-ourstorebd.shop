'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { submitMessage } from '@/lib/features/contact/contactSlice'
import { BreadcrumbJsonLd, FaqJsonLd } from '@/components/seo/JsonLd'
import toast from 'react-hot-toast'
import { 
    Phone, 
    Mail, 
    MapPin, 
    Clock, 
    Send, 
    MessageSquare, 
    ShieldCheck, 
    Headphones, 
    CheckCircle2, 
    ChevronDown, 
    HelpCircle,
    ExternalLink,
    Sparkles
} from 'lucide-react'

export default function ContactPage() {
    useEffect(() => {
        document.title = "Contact Us - Our Store BD | Customer Care, Helpline, WhatsApp & Dhaka Hub";
    }, []);
    const dispatch = useDispatch()
    const storeInfo = useSelector(state => state.contact?.storeInfo) || {}

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: 'Order Status & Tracking',
        message: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [activeFaq, setActiveFaq] = useState(null)

    const subjects = [
        'Order Status & Tracking',
        'Product Inquiry & Availability',
        'Warranty & Return Claim',
        'Corporate & Bulk Order',
        'Payment & Billing Support',
        'Feedback & Suggestions',
        'Other Inquiries'
    ]

    const faqs = [
        {
            q: "How fast will my order be delivered?",
            qBn: "অর্ডার করার পর কত দ্রুত ডেলিভারি পাব?",
            a: "For Dhaka city, we deliver within 24 to 48 hours. For all other 64 districts across Bangladesh, standard courier delivery takes 48 to 72 hours with real-time SMS tracking."
        },
        {
            q: "Can I inspect the parcel before paying Cash on Delivery (COD)?",
            qBn: "ক্যাশ অন ডেলিভারিতে পার্সেল চেক করে নেওয়ার সুযোগ আছে কি?",
            a: "Yes! You can physically verify the sealed box and product in front of the courier delivery representative before completing the payment."
        },
        {
            q: "How does the 7-day easy replacement policy work?",
            qBn: "৭ দিনের রিপ্লেসমেন্ট পলিসি কীভাবে কাজ করে?",
            a: "If your product arrives with any manufacturing defect or issue, inform us within 7 days via phone, WhatsApp, or this contact form. We will arrange a free exchange or refund."
        },
        {
            q: "Are all products original with warranty?",
            qBn: "সব পণ্য কি অরিজিনাল এবং অফিসিয়াল ওয়ারেন্টি যুক্ত?",
            a: "100% of our products are brand new, sealed, and genuine with manufacturer or importer warranty coverage. We never sell replicas or grey market copies."
        }
    ]

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            toast.error("Please enter your name")
            return
        }
        if (!formData.email.trim() && !formData.phone.trim()) {
            toast.error("Please provide either your phone number or email")
            return
        }
        if (!formData.message.trim()) {
            toast.error("Please write your message")
            return
        }

        setSubmitting(true)

        setTimeout(() => {
            dispatch(submitMessage({
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                subject: formData.subject,
                message: formData.message.trim(),
            }))

            setSubmitting(false)
            setSubmitted(true)
            toast.success("আপনার বার্তা সফলভাবে পাঠানো হয়েছে! শীঘ্রই আমরা যোগাযোগ করব।", {
                duration: 4000,
                icon: '🚀',
            })

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: 'Order Status & Tracking',
                message: ''
            })

            setTimeout(() => setSubmitted(false), 5000)
        }, 600)
    }

    const cleanWhatsApp = (storeInfo.whatsapp || storeInfo.phone || '+8801712345678').replace(/[^0-9]/g, '')
    const cleanPhone = (storeInfo.phone || '+8801712345678').replace(/[^0-9+]/g, '')

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Structured Schema Data */}
            <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Contact Us", url: "/contact" }]} />
            <FaqJsonLd faqs={faqs} />

            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                    <Link href="/" className="hover:text-green-600 transition">Home</Link>
                    <span>/</span>
                    <span className="text-green-600 font-semibold">Contact Us</span>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-8 sm:p-14 shadow-xl">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-4">
                            <Sparkles size={16} />
                            <span>WE'RE ALWAYS HERE TO HELP</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                            Get in Touch with <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Our Support Team</span>
                        </h1>
                        <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                            Have questions about a product, delivery status, bulk corporate orders, or warranty claims? Reach out to us anytime — our support team in Dhaka replies rapidly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Contact Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    
                    {/* Left: Contact Info & Quick Reach Cards */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Direct Helpline Cards */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Direct Assistance</h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">Connect with us instantly via phone or chat</p>
                            </div>

                            <div className="space-y-4">
                                {/* Phone Call Card */}
                                <a 
                                    href={`tel:${cleanPhone}`}
                                    className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/70 hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                        <Phone size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Call Helpline</p>
                                        <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{storeInfo.phone || '+880 1712-345678'}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Sat – Thu (9:00 AM - 10:00 PM)</p>
                                    </div>
                                </a>

                                {/* WhatsApp Card */}
                                <a 
                                    href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent('Hello Our Store BD, I would like to inquire about a product/order.')}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-4 p-4 rounded-2xl bg-green-50/70 border border-green-200 hover:bg-green-100/70 hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 rounded-xl bg-[#25D366] text-white shadow-sm group-hover:scale-110 transition-transform">
                                        <MessageSquare size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">WhatsApp Chat</p>
                                            <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.2 rounded-full font-bold">Fastest</span>
                                        </div>
                                        <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{storeInfo.whatsapp || storeInfo.phone || '+880 1712-345678'}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">Click to start direct chat <ExternalLink size={12} /></p>
                                    </div>
                                </a>

                                {/* Email Support Card */}
                                <a 
                                    href={`mailto:${storeInfo.email || 'ourstorebd.shop@gmail.com'}`}
                                    className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 hover:bg-blue-100/70 hover:shadow-md transition-all group"
                                >
                                    <div className="p-3 rounded-xl bg-blue-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                        <Mail size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Official Email</p>
                                        <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 truncate max-w-[200px] sm:max-w-none">{storeInfo.email || 'ourstorebd.shop@gmail.com'}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Response within 2-4 hours</p>
                                    </div>
                                </a>
                            </div>

                            {/* Store Location & Office Hours */}
                            <div className="pt-4 border-t border-slate-100 space-y-3.5 text-xs sm:text-sm text-slate-600">
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-slate-800">Experience Store & Dispatch Hub</p>
                                        <p className="text-slate-500 mt-0.5 leading-relaxed">{storeInfo.address || 'House #42, Road #11, Dhanmondi, Dhaka-1209, Bangladesh'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-slate-800">Operating Schedule</p>
                                        <p className="text-slate-500 mt-0.5">{storeInfo.businessHours || 'Saturday – Thursday: 9:00 AM – 10:00 PM (Friday: 2:00 PM – 10:00 PM)'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Trust Box */}
                        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-7 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                <ShieldCheck size={26} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm sm:text-base">Guaranteed Response</h4>
                                <p className="text-xs text-emerald-100 mt-0.5">Every customer message is tracked and attended by our senior management team.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm relative">
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider mb-2">
                                    <Send size={13} />
                                    <span>Send A Message</span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                                    How can we help you today?
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Fill out this form and our customer representative will get back to you shortly.
                                </p>
                            </div>

                            {submitted && (
                                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                                    <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="font-bold">ধন্যবাদ! আপনার বার্তা সফলভাবে জমা হয়েছে।</p>
                                        <p className="text-emerald-700 text-xs mt-0.5">আমাদের কাস্টমার কেয়ার টিম দ্রুত আপনার সাথে যোগাযোগ করবে।</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                                {/* Name & Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Your Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Tanvir Hasan"
                                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Phone Number <span className="text-slate-400 font-normal">(01XXXXXXXXX)</span>
                                        </label>
                                        <input 
                                            type="tel" 
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="e.g. 01712345678"
                                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Email & Subject */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Email Address <span className="text-slate-400 font-normal">(optional)</span>
                                        </label>
                                        <input 
                                            type="email" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="e.g. tanvir@gmail.com"
                                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Subject / Category <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition cursor-pointer"
                                        >
                                            {subjects.map((subj, i) => (
                                                <option key={i} value={subj}>{subj}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Your Detailed Message <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">{formData.message.length} characters</span>
                                    </div>
                                    <textarea 
                                        rows={5}
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Please describe your question or issue in detail (order number, product name, or required help)..."
                                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition resize-y"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Sending Message...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            <span>Send Message Now (বার্তা পাঠান)</span>
                                        </>
                                    )}
                                </button>

                                <p className="text-[11px] text-center text-slate-400 pt-1">
                                    🔒 Your contact details are 100% confidential and only used to respond to your inquiry.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Google Maps / Location Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                                <MapPin size={14} />
                                <span>Visit Us in Dhaka</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Store & Experience Hub Location</h3>
                        </div>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeInfo.address || 'Dhanmondi, Dhaka, Bangladesh')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-xs transition flex items-center gap-2 self-start sm:self-auto border border-slate-200"
                        >
                            <span>Open in Google Maps</span>
                            <ExternalLink size={14} />
                        </a>
                    </div>

                    {/* Responsive Map Container */}
                    <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
                        <iframe
                            src={storeInfo.googleMapsEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14608.036944850388!2d90.3758!3d23.7465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b087026b81%3A0x8fa563bbdd5904c2!2sDhanmondi%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Our Store BD Location"
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-2">
                        <HelpCircle size={14} />
                        <span>Frequently Asked Questions</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                        Quick Answers to Common Queries
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Find instant solutions before sending your inquiry.
                    </p>
                </div>

                <div className="space-y-3.5">
                    {faqs.map((faq, index) => {
                        const isOpen = activeFaq === index
                        return (
                            <div 
                                key={index}
                                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
                            >
                                <button 
                                    onClick={() => setActiveFaq(isOpen ? null : index)}
                                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-slate-800 text-sm sm:text-base hover:bg-slate-50/70 transition"
                                >
                                    <div>
                                        <p>{faq.q}</p>
                                        <p className="text-xs text-emerald-600 font-normal mt-0.5">{faq.qBn}</p>
                                    </div>
                                    <ChevronDown 
                                        size={20} 
                                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} 
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
