'use client'
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'
import { isDemoProduct } from '@/app/StoreProvider'

const LatestProducts = () => {
    const displayQuantity = 4
    const products = useSelector(state => state.product?.list || [])
    const isHydrated = useSelector(state => state.product?.isHydrated)

    // Filter out any demo dummy products
    const realProducts = products.filter(p => !isDemoProduct(p))

    // Explicitly marked latest products (admin selected "Latest Products")
    const explicitLatest = realProducts.filter(p =>
        p.sections && Array.isArray(p.sections) && p.sections.includes('latest')
    )

    // Products without explicit latest section
    const otherProducts = realProducts.filter(p =>
        !p.sections || !Array.isArray(p.sections) || !p.sections.includes('latest')
    )

    // Sort explicit first (newest first), then other real products (newest first)
    const sortedExplicit = explicitLatest.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    const sortedOther = otherProducts.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    // If explicit exists, use explicit first; if not, use newest real products
    const latestProducts = sortedExplicit.length > 0
        ? [...sortedExplicit, ...sortedOther]
        : sortedOther

    const showingCount = Math.min(displayQuantity, latestProducts.length)

    return (
        <div className='px-4 sm:px-6 my-16 sm:my-30 max-w-6xl mx-auto'>
            <Title
                title='Latest Products'
                description={
                    !isHydrated && realProducts.length === 0
                        ? 'পণ্য লোড হচ্ছে...'
                        : `Showing ${showingCount} of ${latestProducts.length} products`
                }
                href='/shop'
            />

            {!isHydrated && realProducts.length === 0 ? (
                // Modern Skeleton Loader (prevents any demo data flash)
                <div className='mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
                    {Array.from({ length: displayQuantity }).map((_, index) => (
                        <div key={index} className='animate-pulse bg-white rounded-2xl p-3 border border-slate-100 shadow-sm space-y-3'>
                            <div className='bg-slate-100 rounded-xl h-44 sm:h-52 w-full' />
                            <div className='h-4 bg-slate-100 rounded-md w-3/4' />
                            <div className='h-3 bg-slate-100 rounded-md w-1/2' />
                            <div className='flex justify-between items-center pt-2'>
                                <div className='h-5 bg-slate-100 rounded w-1/3' />
                                <div className='h-8 bg-slate-100 rounded-lg w-1/2' />
                            </div>
                        </div>
                    ))}
                </div>
            ) : latestProducts.length === 0 ? (
                <div className='mt-8 text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 text-slate-500'>
                    <p className='font-medium'>কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                    <p className='text-xs mt-1 text-slate-400'>এডমিন প্যানেল থেকে নতুন প্রোডাক্ট যোগ করুন</p>
                </div>
            ) : (
                <div className='mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
                    {latestProducts.slice(0, displayQuantity).map((product, index) => (
                        <ProductCard key={product.id || index} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default LatestProducts