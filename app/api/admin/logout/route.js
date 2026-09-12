import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/security/auth'

export async function POST() {
    const response = NextResponse.json({ success: true, message: 'লগআউট সফল হয়েছে।' })
    response.cookies.delete(COOKIE_NAME)
    return response
}
