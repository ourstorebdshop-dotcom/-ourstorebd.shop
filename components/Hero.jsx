'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useSelector } from 'react-redux'
import CategoriesMarquee from './CategoriesMarquee'
import { defaultHeroData } from '@/lib/features/hero/heroSlice'

// Preset background style mappings
export const heroBgPresets = {
    green: { name: 'Mint Green', class: 'bg-green-200', hex: '#bbf7d0', badgeClass: 'bg-green-300 text-green-600', badgeTag: 'bg-green-600' },
    orange: { name: 'Soft Peach', class: 'bg-orange-200', hex: '#fed7aa', badgeClass: 'bg-orange-300 text-orange-700', badgeTag: 'bg-orange-600' },
    blue: { name: 'Soft Sky', class: 'bg-blue-200', hex: '#bfdbfe', badgeClass: 'bg-blue-300 text-blue-700', badgeTag: 'bg-blue-600' },
    purple: { name: 'Lavender', class: 'bg-purple-200', hex: '#e9d5ff', badgeClass: 'bg-purple-300 text-purple-700', badgeTag: 'bg-purple-600' },
    rose: { name: 'Soft Rose', class: 'bg-rose-200', hex: '#fecdd3', badgeClass: 'bg-rose-300 text-rose-700', badgeTag: 'bg-rose-600' },
    amber: { name: 'Warm Amber', class: 'bg-amber-200', hex: '#fde68a', badgeClass: 'bg-amber-300 text-amber-800', badgeTag: 'bg-amber-600' },
    slate: { name: 'Sleek Dark', class: 'bg-slate-800 text-white', hex: '#1e293b', badgeClass: 'bg-slate-700 text-slate-200', badgeTag: 'bg-green-500' },
    custom: { name: 'Custom Color', class: '', hex: '' }
}

const Hero = () => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '৳'
    const heroState = useSelector(state => state.hero) || defaultHeroData

    const hero = {
        showHero: heroState.showHero !== undefined ? heroState.showHero : defaultHeroData.showHero,
        showMarquee: heroState.showMarquee !== undefined ? heroState.showMarquee : defaultHeroData.showMarquee,
        mainBanner: { ...defaultHeroData.mainBanner, ...(heroState.mainBanner || {}) },
        sideCard1: { ...defaultHeroData.sideCard1, ...(heroState.sideCard1 || {}) },
        sideCard2: { ...defaultHeroData.sideCard2, ...(heroState.sideCard2 || {}) },
    }

    const { mainBanner, sideCard1, sideCard2 } = hero

    if (!hero.showHero) {
        return hero.showMarquee ? (
            <div className='mx-4 sm:mx-6 my-6'>
                <CategoriesMarquee />
            </div>
        ) : null
    }

    const mainPreset = heroBgPresets[mainBanner.bgPreset] || heroBgPresets.green
    const mainBgClass = mainBanner.bgPreset === 'custom' ? '' : (mainPreset.class || 'bg-green-200')
    const mainBgStyle = mainBanner.bgPreset === 'custom' && mainBanner.bgColor ? { backgroundColor: mainBanner.bgColor } : {}

    const card1Preset = heroBgPresets[sideCard1.bgPreset] || heroBgPresets.orange
    const card1BgClass = sideCard1.bgPreset === 'custom' ? '' : (card1Preset.class || 'bg-orange-200')
    const card1BgStyle = sideCard1.bgPreset === 'custom' && sideCard1.bgColor ? { backgroundColor: sideCard1.bgColor } : {}

    const card2Preset = heroBgPresets[sideCard2.bgPreset] || heroBgPresets.blue
    const card2BgClass = sideCard2.bgPreset === 'custom' ? '' : (card2Preset.class || 'bg-blue-200')
    const card2BgStyle = sideCard2.bgPreset === 'custom' && sideCard2.bgColor ? { backgroundColor: sideCard2.bgColor } : {}

    return (
        <div className='mx-4 sm:mx-6'>
            <div className='flex max-xl:flex-col gap-4 sm:gap-8 max-w-7xl mx-auto my-6 sm:my-10'>
                {/* Main Hero Card */}
                <div 
                    className={`relative flex-1 flex flex-col ${mainBgClass} rounded-3xl xl:min-h-100 group overflow-hidden`}
                    style={mainBgStyle}
                >
                    <div className='p-5 sm:p-16 z-10'>
                        {/* Badge */}
                        {mainBanner.showBadge && (
                            mainBanner.badgeLink ? (
                                <Link href={mainBanner.badgeLink} className={`inline-flex items-center gap-3 ${mainPreset.badgeClass || 'bg-green-300 text-green-600'} pr-4 p-1 rounded-full text-xs sm:text-sm hover:opacity-90 transition`}>
                                    {mainBanner.badgeTag && (
                                        <span className={`${mainPreset.badgeTag || 'bg-green-600'} px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs font-semibold`}>
                                            {mainBanner.badgeTag}
                                        </span>
                                    )}
                                    <span>{mainBanner.badgeText}</span>
                                    <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                                </Link>
                            ) : (
                                <div className={`inline-flex items-center gap-3 ${mainPreset.badgeClass || 'bg-green-300 text-green-600'} pr-4 p-1 rounded-full text-xs sm:text-sm`}>
                                    {mainBanner.badgeTag && (
                                        <span className={`${mainPreset.badgeTag || 'bg-green-600'} px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs font-semibold`}>
                                            {mainBanner.badgeTag}
                                        </span>
                                    )}
                                    <span>{mainBanner.badgeText}</span>
                                    <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                                </div>
                            )
                        )}

                        {/* Title */}
                        <h2 className='text-3xl sm:text-5xl leading-[1.18] my-3 font-bold text-slate-800 tracking-tight max-w-xs sm:max-w-md'>
                            {mainBanner.title}
                        </h2>

                        {/* Price */}
                        {mainBanner.showPrice && (
                            <div className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'>
                                <p className='text-xs sm:text-sm font-medium text-slate-600'>{mainBanner.priceLabel}</p>
                                <p className='text-2xl sm:text-3xl font-bold tracking-tight text-slate-900'>{currency}{mainBanner.priceValue}</p>
                            </div>
                        )}

                        {/* Button */}
                        {mainBanner.showButton && (
                            <Link 
                                href={mainBanner.buttonLink || '/shop'} 
                                className='bg-slate-900 text-white text-xs sm:text-sm font-semibold py-3 sm:py-4 px-7 sm:px-10 mt-4 sm:mt-8 rounded-xl shadow-sm hover:bg-slate-800 hover:shadow-md hover:scale-102 active:scale-95 transition-all duration-200 inline-block'
                            >
                                {mainBanner.buttonText}
                            </Link>
                        )}
                    </div>

                    {/* Main Image */}
                    {mainBanner.image ? (
                        <img 
                            className='sm:absolute bottom-0 right-0 md:right-8 w-full sm:max-w-sm max-h-96 object-contain z-0 pointer-events-none' 
                            src={mainBanner.image} 
                            alt={mainBanner.title || "Shop gadgets"} 
                        />
                    ) : (
                        <Image 
                            priority
                            className='sm:absolute bottom-0 right-0 md:right-8 w-full sm:max-w-sm max-h-96 object-contain pointer-events-none' 
                            src={assets.hero_model_img} 
                            alt="Shop gadgets" 
                        />
                    )}
                </div>

                {/* Right Side Cards */}
                {(sideCard1.showCard || sideCard2.showCard) && (
                    <div className='flex flex-col md:flex-row xl:flex-col gap-4 sm:gap-5 w-full xl:max-w-sm text-sm text-slate-600'>
                        {/* Side Card 1 */}
                        {sideCard1.showCard && (
                            <Link 
                                href={sideCard1.link || '/shop'} 
                                className={`flex-1 flex items-center justify-between w-full ${card1BgClass} rounded-3xl p-6 px-8 group transition-all duration-300 hover:shadow-md`}
                                style={card1BgStyle}
                            >
                                <div>
                                    <p className='text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight max-w-40 leading-tight'>
                                        {sideCard1.title}
                                    </p>
                                    <p className='flex items-center gap-1 mt-4 font-medium text-slate-700'>
                                        {sideCard1.buttonText} <ArrowRightIcon className='group-hover:ml-1.5 transition-all' size={18} />
                                    </p>
                                </div>
                                {sideCard1.image ? (
                                    <img 
                                        className='w-24 sm:w-32 max-h-28 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300' 
                                        src={sideCard1.image} 
                                        alt={sideCard1.title || "Best products"} 
                                    />
                                ) : (
                                    <Image className='w-24 sm:w-32 h-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300' src={assets.hero_product_img1} alt="Best products" />
                                )}
                            </Link>
                        )}

                        {/* Side Card 2 */}
                        {sideCard2.showCard && (
                            <Link 
                                href={sideCard2.link || '/shop'} 
                                className={`flex-1 flex items-center justify-between w-full ${card2BgClass} rounded-3xl p-6 px-8 group transition-all duration-300 hover:shadow-md`}
                                style={card2BgStyle}
                            >
                                <div>
                                    <p className='text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight max-w-40 leading-tight'>
                                        {sideCard2.title}
                                    </p>
                                    <p className='flex items-center gap-1 mt-4 font-medium text-slate-700'>
                                        {sideCard2.buttonText} <ArrowRightIcon className='group-hover:ml-1.5 transition-all' size={18} />
                                    </p>
                                </div>
                                {sideCard2.image ? (
                                    <img 
                                        className='w-24 sm:w-32 max-h-28 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300' 
                                        src={sideCard2.image} 
                                        alt={sideCard2.title || "20% discounts"} 
                                    />
                                ) : (
                                    <Image className='w-24 sm:w-32 h-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300' src={assets.hero_product_img2} alt="20% discounts" />
                                )}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Marquee Categories */}
            {hero.showMarquee && <CategoriesMarquee />}
        </div>
    )
}

export default Hero