'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { ChevronRight, HomeIcon, Package } from "lucide-react";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

export default function Product() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [hasChecked, setHasChecked] = useState(false);
    const products = useSelector(state => state.product.list);

    useEffect(() => {
        if (products && products.length > 0) {
            const foundProduct = products.find((p) => p.id === productId);
            setProduct(foundProduct || null);
            setHasChecked(true);
            if (foundProduct?.name) {
                document.title = `${foundProduct.name} - Buy Online in Bangladesh | Our Store BD`;
            }
        }
        window.scrollTo(0, 0);
    }, [productId, products]);

    const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Products", url: "/shop" },
        ...(product?.category ? [{ name: product.category, url: `/shop?search=${encodeURIComponent(product.category)}` }] : []),
        ...(product?.name ? [{ name: product.name, url: `/product/${productId}` }] : [])
    ];

    return (
        <div className="mx-4 sm:mx-6 pb-20">
            {/* Structured Schema Markup */}
            {product && <ProductJsonLd product={product} />}
            <BreadcrumbJsonLd items={breadcrumbs} />

            <div className="max-w-7xl mx-auto">
                {/* Visual Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-500 my-6">
                    <Link href="/" className="hover:text-green-600 transition flex items-center gap-1">
                        <HomeIcon size={14} />
                        <span>Home</span>
                    </Link>
                    <ChevronRight size={14} className="text-slate-400" />
                    <Link href="/shop" className="hover:text-green-600 transition">
                        Products
                    </Link>
                    {product?.category && (
                        <>
                            <ChevronRight size={14} className="text-slate-400" />
                            <Link href={`/shop?search=${encodeURIComponent(product.category)}`} className="hover:text-green-600 transition">
                                {product.category}
                            </Link>
                        </>
                    )}
                    {product?.name && (
                        <>
                            <ChevronRight size={14} className="text-slate-400" />
                            <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-md">
                                {product.name}
                            </span>
                        </>
                    )}
                </nav>

                {/* Product Details Component */}
                {product ? (
                    <>
                        <ProductDetails product={product} />
                        <ProductDescription product={product} />
                    </>
                ) : hasChecked ? (
                    <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500 text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                            <Package size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">পণ্যটি খুঁজে পাওয়া যায়নি</h2>
                        <p className="text-sm text-slate-500 max-w-md mb-6">দুঃখিত, আপনি যে পণ্যটি খুঁজছেন তা বর্তমানে উপলব্ধ নেই অথবা সরানো হয়েছে।</p>
                        <Link href="/shop" className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition shadow-xs">
                            সকল পণ্য দেখুন
                        </Link>
                    </div>
                ) : (
                    <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
                        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="font-medium text-sm">পণ্য লোড হচ্ছে (Loading product)...</p>
                    </div>
                )}
            </div>
        </div>
    );
}