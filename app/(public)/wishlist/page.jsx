import { redirect } from 'next/navigation'

export const metadata = {
    title: 'আমার পছন্দের তালিকা (Wishlist) | Our Store BD',
    description: 'আপনার প্রিয় গ্যাজেট ও ইলেকট্রনিক্স পণ্যসমূহের পছন্দের তালিকা দেখুন',
}

export default function WishlistPage() {
    redirect('/profile?tab=wishlist')
}
