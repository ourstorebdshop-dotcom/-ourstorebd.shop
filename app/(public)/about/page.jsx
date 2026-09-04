'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { 
    ShieldCheck, 
    Truck, 
    RotateCcw, 
    BadgePercent, 
    CreditCard, 
    Headphones, 
    Sparkles, 
    CheckCircle2, 
    MapPin, 
    Phone, 
    Mail, 
    ArrowRight, 
    HeartHandshake, 
    Store, 
    Award, 
    Zap, 
    Users, 
    ShoppingBag,
    PackageCheck
} from 'lucide-react'

export default function AboutPage() {
    useEffect(() => {
        document.title = "About Us - Our Store BD | Trusted Electronics & Gadgets Shop in Bangladesh";
    }, []);
    const stats = [
        {
            value: "10,000+",
            label: "Happy Customers",
            sublabel: "সন্তুষ্ট গ্রাহক",
            icon: Users,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
            value: "100%",
            label: "Authentic Products",
            sublabel: "শতভাগ আসল পণ্য",
            icon: ShieldCheck,
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            value: "64",
            label: "Districts Delivery",
            sublabel: "সারাদেশে ডেলিভারি",
            icon: Truck,
            color: "text-orange-600 bg-orange-50 border-orange-100"
        },
        {
            value: "24/7",
            label: "Customer Support",
            sublabel: "সার্বক্ষণিক সহায়তা",
            icon: Headphones,
            color: "text-purple-600 bg-purple-50 border-purple-100"
        }
    ]

    const coreValues = [
        {
            title: "100% Genuine & Authentic",
            bengaliTitle: "শতভাগ আসল পণ্যের নিশ্চয়তা",
            description: "We source all electronics and gadgets directly from authorized distributors and verified manufacturers. No fakes, no replicas.",
            icon: ShieldCheck,
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
            borderColor: "border-emerald-200/60"
        },
        {
            title: "Fast Nationwide Delivery",
            bengaliTitle: "সারা দেশে দ্রুততম ডেলিভারি",
            description: "Express delivery within 24-48 hours in Dhaka and 48-72 hours across all 64 districts of Bangladesh with live parcel tracking.",
            icon: Zap,
            bgColor: "bg-amber-50",
            textColor: "text-amber-600",
            borderColor: "border-amber-200/60"
        },
        {
            title: "7 Days Easy Return",
            bengaliTitle: "৭ দিনের সহজ রিটার্ন পলিসি",
            description: "If you encounter any manufacturing defect or receive the wrong item, we offer hassle-free return and replacement.",
            icon: RotateCcw,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
            borderColor: "border-purple-200/60"
        },
        {
            title: "Best Value & Fair Prices",
            bengaliTitle: "সেরা মূল্যের প্রতিশ্রুতি",
            description: "Transparent pricing in Bangladeshi Taka (৳) with frequent promotional discounts, coupons, and flash deals.",
            icon: BadgePercent,
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            borderColor: "border-blue-200/60"
        },
        {
            title: "Cash on Delivery & Secure Pay",
            bengaliTitle: "ক্যাশ অন ডেলিভারি ও নিরাপদ পেমেন্ট",
            description: "Pay conveniently upon receiving your parcel at your doorstep or pay digitally via bKash, Nagad, and cards.",
            icon: CreditCard,
            bgColor: "bg-rose-50",
            textColor: "text-rose-600",
            borderColor: "border-rose-200/60"
        },
        {
            title: "Dedicated After-Sales Service",
            bengaliTitle: "অসাধারণ কাস্টমার কেয়ার",
            description: "Our friendly support team is always ready to assist you via phone, WhatsApp, and email for all your inquiries.",
            icon: HeartHandshake,
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            borderColor: "border-indigo-200/60"
        }
    ]

    const whyChooseList = [
        "Strict quality assurance and physical inspection before every dispatch",
        "Transparent parcel opening and verification option upon delivery",
        "Official brand warranty and quick customer-centric resolution",
        "Over 10,000+ verified customer reviews and 4.8★ average rating",
        "Responsive helpline & active WhatsApp assistance for every order"
    ]

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Structured Schema Data */}
            <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "About Us", url: "/about" }]} />

            {/* Breadcrumb Bar */}
            <div className="bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
                    <Link href="/" className="hover:text-green-600 transition">Home</Link>
                    <span>/</span>
                    <span className="text-green-600 font-semibold">About Us</span>
                </div>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-10">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-8 sm:p-14 lg:p-16 shadow-xl">
                    {/* Background Decorative Glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6">
                            <Sparkles size={16} />
                            <span>WELCOME TO OUR STORE BD</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
                            Empowering Bangladesh with <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 bg-clip-text text-transparent">Authentic Gadgets</span> & Lifestyle.
                        </h1>

                        <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                            We are your trusted online destination for authentic electronics, smartwatches, headphones, audio gear, and lifestyle tech in Bangladesh. Making life smarter, easier, and more delightful every day.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            <Link 
                                href="/shop" 
                                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold text-sm hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <ShoppingBag size={18} />
                                <span>Browse Products</span>
                            </Link>
                            <Link 
                                href="/#newsletter" 
                                className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm transition backdrop-blur-sm"
                            >
                                Contact Our Team
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
                    {stats.map((stat, index) => (
                        <div 
                            key={index}
                            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    {stat.value}
                                </span>
                                <div className={`p-2.5 rounded-xl border ${stat.color} transition-transform group-hover:scale-110`}>
                                    <stat.icon size={22} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{stat.sublabel}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Our Story Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Story Text */}
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider mb-3">
                            <Store size={14} />
                            <span>Our Journey & Passion</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                            Built with Trust, Designed for Tech Lovers across Bangladesh
                        </h2>
                        <p className="mt-5 text-slate-600 leading-relaxed text-sm sm:text-base">
                            Founded in Dhaka, <strong>Our Store BD</strong> was born out of a clear and passionate mission: to solve the pervasive problem of counterfeit tech products and provide Bangladeshi customers with authentic, world-class electronics at honest prices.
                        </p>
                        <p className="mt-4 text-slate-600 leading-relaxed text-sm sm:text-base">
                            Whether you are searching for noise-cancelling headphones for your daily commute, high-precision smartwatches to track your health, or smart home gadgets to elevate your living space, we test and curate each product with extreme care.
                        </p>

                        <div className="mt-6 border-l-4 border-emerald-500 pl-4 py-1 text-slate-700 italic text-sm sm:text-base bg-emerald-50/50 rounded-r-lg">
                            "Our goal isn't just selling gadgets — it's about building lasting relationships grounded in quality, honesty, and lightning-fast service."
                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {whyChooseList.map((point, index) => (
                                <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visual Showcase Card */}
                    <div className="lg:col-span-5">
                        <div className="relative rounded-3xl bg-gradient-to-tr from-emerald-100 via-green-50 to-slate-100 p-7 sm:p-9 border border-emerald-200/60 shadow-lg">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
                                        OS
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">Our Store BD</h3>
                                        <p className="text-xs text-slate-500">Dhaka, Bangladesh</p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4 text-xs sm:text-sm">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-600 font-medium flex items-center gap-2">
                                            <PackageCheck size={16} className="text-emerald-500" />
                                            Original Warranty
                                        </span>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">100% Guaranteed</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-600 font-medium flex items-center gap-2">
                                            <Truck size={16} className="text-blue-500" />
                                            Free Shipping
                                        </span>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">Orders above ৳500</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-600 font-medium flex items-center gap-2">
                                            <CreditCard size={16} className="text-purple-500" />
                                            Payment Method
                                        </span>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">Cash on Delivery / bKash</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-600 font-medium flex items-center gap-2">
                                            <RotateCcw size={16} className="text-orange-500" />
                                            Return Window
                                        </span>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">7 Days Return</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                                    <p className="text-xs text-slate-400">Trusted by thousands of gadget enthusiasts across BD</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Values Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                <div className="text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Award size={14} />
                        <span>Why Choose Us</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                        Our Promises & Core Pillars
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-slate-500">
                        Every service and feature at Our Store BD is built to give you the most seamless and secure shopping experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                    {coreValues.map((value, index) => (
                        <div 
                            key={index}
                            className={`p-7 rounded-2xl bg-white border ${value.borderColor} shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between`}
                        >
                            <div>
                                <div className={`w-14 h-14 rounded-2xl ${value.bgColor} ${value.textColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <value.icon size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition">
                                    {value.title}
                                </h3>
                                <p className="text-xs font-medium text-emerald-600/90 mt-0.5">
                                    {value.bengaliTitle}
                                </p>
                                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                                    {value.description}
                                </p>
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-slate-400 group-hover:text-emerald-600 transition">
                                <span>Verified Guarantee</span>
                                <CheckCircle2 size={14} className="ml-1.5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mission & Vision Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mission Card */}
                    <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-8 sm:p-10 shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
                            <Store size={220} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white mb-6">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Our Mission (আমাদের লক্ষ্য)</h3>
                            <p className="text-emerald-50 text-sm sm:text-base leading-relaxed">
                                To democratize access to genuine high-performance consumer tech in Bangladesh by providing authentic products, transparent pricing, exceptional logistics, and empathetic customer care.
                            </p>
                        </div>
                    </div>

                    {/* Vision Card */}
                    <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 sm:p-10 shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10">
                            <Award size={220} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-emerald-400 mb-6">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Our Vision (আমাদের ভিশন)</h3>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                To become Bangladesh's most customer-loved and trusted technology e-commerce brand, known for innovation, speed, zero-compromise product authenticity, and memorable shopping experiences.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Contact & Support Callout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center lg:text-left">
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">
                            Have questions or need assistance?
                        </h3>
                        <p className="mt-2 text-slate-500 text-sm sm:text-base">
                            Our support specialists in Dhaka are available every day to help you choose the right gadget or track your existing order.
                        </p>
                        <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-sm text-slate-600 font-medium">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-green-600" />
                                <span>Dhaka, Bangladesh</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={18} className="text-green-600" />
                                <span>ourstorebd.shop@gmail.com</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto">
                        <Link 
                            href="/shop" 
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition text-center shadow-sm"
                        >
                            Explore Store
                        </Link>
                        <Link 
                            href="/#newsletter" 
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition text-center"
                        >
                            Get in Touch
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
