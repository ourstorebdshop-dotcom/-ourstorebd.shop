import React from 'react'
import Title from './Title'
import toast from 'react-hot-toast'

const Newsletter = () => {

    const handleSubscribe = (e) => {
        e.preventDefault()
        toast.success('Thank you for subscribing!')
        e.target.reset()
    }

    return (
        <div id="newsletter" className='flex flex-col items-center mx-4 sm:mx-4 my-20 sm:my-36'>
            <Title title="Join Newsletter" description="Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week." visibleButton={false} />
            <form onSubmit={handleSubscribe} className='flex flex-col sm:flex-row bg-slate-100 text-sm p-1.5 sm:p-1 rounded-2xl sm:rounded-full w-full max-w-xl my-6 sm:my-10 border-2 border-white ring ring-slate-200 gap-1.5 sm:gap-0'>
                <input className='flex-1 pl-4 sm:pl-5 py-3 sm:py-0 outline-none bg-transparent rounded-xl sm:rounded-none' type="email" placeholder='Enter your email address' required />
                <button className='font-medium bg-green-500 text-white px-7 py-3 rounded-xl sm:rounded-full hover:scale-103 active:scale-95 transition'>Get Updates</button>
            </form>
        </div>
    )
}

export default Newsletter