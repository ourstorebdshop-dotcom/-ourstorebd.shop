'use client'
import { Suspense } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon, HomeIcon, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import Link from "next/link"
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/JsonLd"
import { isDemoProduct } from "@/app/StoreProvider"

function ShopContent() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search')
    const router = useRouter()

    const rawProducts = useSelector(state => state.product?.list) || []
    const isHydrated = useSelector(state => state.product?.isHydrated)
    const products = rawProducts.filter(p => !isDemoProduct(p))

    const filteredProducts = search
        ? products.filter(product =>
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            (product.categories && Array.isArray(product.categories)
                ? product.categories.some(cat => cat.toLowerCase().includes(search.toLowerCase()))
                : (product.category && product.category.toLowerCase().includes(search.toLowerCase()))
            ) ||
            (product.description && product.description.toLowerCase().includes(search.toLowerCase()))
        )
        : products;

    const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: search ? `Search: "${search}"` : "All Products", url: "/shop" }
    ];

    return (
        <div className="min-h-[70vh] mx-4 sm:mx-6 pb-20">
            {/* Structured Schema Data */}
            <BreadcrumbJsonLd items={breadcrumbs} />
            <ItemListJsonLd items={filteredProducts} name="All Electronics & Gadgets" />

            <div className="max-w-7xl mx-auto">
                {/* Visual Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 my-4 sm:my-6">
                    <Link href="/" className="hover:text-green-600 transition flex items-center gap-1">
                        <HomeIcon size={14} />
                        <span>Home</span>
                    </Link>
                    <ChevronRight size={14} className="text-slate-400" />
                    <span className="text-slate-800 font-semibold">
                        {search ? `Search Results for "${search}"` : "Shop All Products"}
                    </span>
                </nav>

                {/* Page Title & Counter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
                    <div>
                        <h1 
                            onClick={() => router.push('/shop')} 
                            className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2 cursor-pointer"
                        >
                            {search && <MoveLeftIcon size={22} className="text-green-600" />}
                            <span>{search ? `Search Results for "${search}"` : "All Electronics & Gadgets"}</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Browse authentic smart devices, earbuds, smartwatches, speakers, and accessories with official warranty in Bangladesh.
                        </p>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
                        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                {/* Product Grid */}
                {!isHydrated && rawProducts.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="animate-pulse bg-white rounded-2xl p-3 border border-slate-100 shadow-sm space-y-3">
                                <div className="bg-slate-100 rounded-xl h-44 sm:h-52 w-full" />
                                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                                <div className="flex justify-between items-center pt-2">
                                    <div className="h-5 bg-slate-100 rounded w-1/3" />
                                    <div className="h-8 bg-slate-100 rounded-lg w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100 my-8">
                        <p className="text-lg font-semibold text-slate-700">কোনো পণ্য পাওয়া যায়নি (No products found)</p>
                        <p className="text-sm text-slate-500 mt-1">অন্য কিওয়ার্ড দিয়ে অনুসন্ধান করার চেষ্টা করুন অথবা সব পণ্য দেখুন।</p>
                        <button
                            onClick={() => router.push('/shop')}
                            className="mt-5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
                        >
                            View All Products
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Shop() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-slate-500 font-medium">Loading products catalog...</div>}>
            <ShopContent />
        </Suspense>
    );
}