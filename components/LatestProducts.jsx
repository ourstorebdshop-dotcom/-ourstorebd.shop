'use client'
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const LatestProducts = () => {

    const displayQuantity = 4
    const products = useSelector(state => state.product.list)

    // Explicitly marked latest products (admin selected "Latest Products")
    const explicitLatest = products.filter(p =>
        p.sections && Array.isArray(p.sections) && p.sections.includes('latest')
    )

    // Old products without sections field (backward compat — fill remaining slots)
    const legacyProducts = products.filter(p => !p.sections || !Array.isArray(p.sections))

    // Explicit products first (newest first), then legacy products (newest first)
    const sortedExplicit = explicitLatest.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const sortedLegacy = legacyProducts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Merge: explicit first, then fill remaining with legacy
    const latestProducts = [...sortedExplicit, ...sortedLegacy]

    return (
        <div className='px-4 sm:px-6 my-16 sm:my-30 max-w-6xl mx-auto'>
            <Title title='Latest Products' description={`Showing ${latestProducts.length < displayQuantity ? latestProducts.length : displayQuantity} of ${latestProducts.length} products`} href='/shop' />
            <div className='mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
                {latestProducts.slice(0, displayQuantity).map((product, index) => (
                    <ProductCard key={index} product={product} />
                ))}
            </div>
        </div>
    )
}

export default LatestProducts