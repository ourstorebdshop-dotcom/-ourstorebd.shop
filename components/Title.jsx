'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Title = ({ title, description, visibleButton = true, href = '' }) => {
    const hasLink = Boolean(href && href.trim() && visibleButton)

    return (
        <div className='flex flex-col items-center'>
            <h2 className='text-2xl font-semibold text-slate-800'>{title}</h2>
            {hasLink ? (
                <Link href={href} className='flex items-center gap-5 text-sm text-slate-600 mt-2 hover:opacity-90 transition-opacity'>
                    <p className='max-w-lg text-center'>{description}</p>
                    <span className='text-green-500 flex items-center gap-1 font-medium'>View more <ArrowRight size={14} /></span>
                </Link>
            ) : (
                <div className='flex items-center gap-5 text-sm text-slate-600 mt-2'>
                    <p className='max-w-lg text-center'>{description}</p>
                    {visibleButton && href && href.trim() && (
                        <Link href={href} className='text-green-500 flex items-center gap-1 font-medium'>View more <ArrowRight size={14} /></Link>
                    )}
                </div>
            )}
        </div>
    )
}

export default Title