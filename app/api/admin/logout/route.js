import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/security/auth'

export async function POST() {
    try {
        const response = NextResponse.json({ success: true, message: 'লগআউট সফল হয়েছে।' })
        response.cookies.delete({ name: COOKIE_NAME, path: '/' })
        return response
    } catch (err) {
        console.error('[Admin Logout] Error:', err)
        return NextResponse.json({ success: false, error: 'লগআউট সম্পন্ন করা সম্ভব হয়নি।' }, { status: 500 })
    }
}
