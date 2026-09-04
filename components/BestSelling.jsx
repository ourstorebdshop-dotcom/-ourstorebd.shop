'use client'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const BestSelling = () => {

    const displayQuantity = 8
    const products = useSelector(state => state.product.list)

    // Explicitly marked bestSelling products (admin selected "Best Selling")
    const explicitBest = products.filter(p =>
        p.sections && Array.isArray(p.sections) && p.sections.includes('bestSelling')
    )

    // Old products without sections field (backward compat — fill remaining slots)
    const legacyProducts = products.filter(p => !p.sections || !Array.isArray(p.sections))

    // Explicit products first (newest first), then legacy products (by rating count)
    const sortedExplicit = explicitBest.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const sortedLegacy = legacyProducts.slice().sort((a, b) => b.rating.length - a.rating.length)

    // Merge: explicit first, then fill remaining with legacy (no duplicates)
    const merged = [...sortedExplicit, ...sortedLegacy]
    const bestProducts = merged

    return (
        <div className='px-4 sm:px-6 my-16 sm:my-30 max-w-6xl mx-auto'>
            <Title title='Best Selling' description={`Showing ${bestProducts.length < displayQuantity ? bestProducts.length : displayQuantity} of ${bestProducts.length} products`} href='/shop' />
            <div className='mt-8 sm:mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
                {bestProducts.slice(0, displayQuantity).map((product, index) => (
                    <ProductCard key={index} product={product} />
                ))}
            </div>
        </div>
    )
}

export default BestSelling