'use client'
import { useSelector } from "react-redux";

import Link from "next/link";

const CategoriesMarquee = () => {
    // Dynamic categories from Redux store (admin-controlled)
    const reduxCategories = useSelector(state => state.category?.categories || [])
    const categories = [...reduxCategories]
        .filter(c => c.visible !== false)
        .sort((a, b) => a.order - b.order)
        .map(c => c.name)

    if (categories.length === 0) return null

    return (
        <div className="overflow-hidden w-full relative max-w-7xl mx-auto select-none group sm:my-20">
            <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="flex min-w-[200%] animate-[marquee_10s_linear_infinite] sm:animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-4" >
                {[...categories, ...categories, ...categories, ...categories].map((company, index) => (
                    <Link 
                        key={index} 
                        href={`/shop?search=${encodeURIComponent(company)}`}
                        className="px-5 py-2 bg-slate-100/90 hover:bg-green-600 hover:text-white text-slate-600 text-xs sm:text-sm font-medium rounded-xl active:scale-95 transition-all duration-200 whitespace-nowrap inline-flex items-center cursor-pointer shadow-2xs"
                    >
                        {company}
                    </Link>
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
        </div>
    );
};

export default CategoriesMarquee;