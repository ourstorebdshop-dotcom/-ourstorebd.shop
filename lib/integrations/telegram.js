/**
 * Telegram Bot Integration Client (Production-Hardened)
 * 
 * Hardening features:
 * 1. Dual-format delivery: Rich HTML with automatic Plain-Text fallback if Telegram parsing errors occur
 * 2. Duplicate notification prevention (idempotency guard)
 * 3. Specific Telegram API error code diagnostics (401 invalid token, 403 bot blocked, 429 rate limit)
 * 4. Resilient timeout handling (6s AbortController)
 * 5. Masking and credential security helpers
 */

/**
 * Format Bangladesh local currency
 */
export function formatCurrency(amount) {
    const val = Number(amount) || 0
    return '৳' + val.toLocaleString('en-IN')
}

/**
 * Format timestamp into readable BD date & time
 */
export function formatOrderDate(dateString) {
    try {
        const d = dateString ? new Date(dateString) : new Date()
        return d.toLocaleString('en-US', {
            timeZone: 'Asia/Dhaka',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    } catch {
        return new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
}

/**
 * Escape HTML special chars for Telegram HTML parse_mode
 */
export function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method) {
    switch ((method || '').toUpperCase()) {
        case 'COD':
            return 'ক্যাশ অন ডেলিভারি (COD)'
        case 'BKASH':
            return 'বিকাশ (bKash Online)'
        case 'NAGAD':
            return 'নগদ (Nagad Online)'
        case 'BANK':
            return 'ব্যাংক ট্রান্সফার (Bank Transfer)'
        default:
            return method || 'ক্যাশ অন ডেলিভারি'
    }
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status) {
    switch ((status || '').toUpperCase()) {
        case 'ORDER_PLACED':
            return 'অর্ডার গৃহীত (ORDER_PLACED)'
        case 'PENDING_REVIEW':
            return 'পর্যালোচনাধীন (PENDING_REVIEW)'
        case 'PROCESSING':
            return 'প্রসেসিং হচ্ছে (PROCESSING)'
        case 'SHIPPED':
            return 'কুরিয়ারে পাঠানো হয়েছে (SHIPPED)'
        case 'DELIVERED':
            return 'ডেলিভার্ড সম্পন্ন (DELIVERED)'
        case 'CANCELLED':
            return 'বাতিল (CANCELLED)'
        case 'REFUNDED':
            return 'রিফান্ড করা হয়েছে (REFUNDED)'
        default:
            return status || 'অর্ডার গৃহীত'
    }
}

/**
 * Build rich HTML message for Telegram
 */
export function buildTelegramOrderMessage(order) {
    const orderId = escapeHtml(order?.id || order?.orderId || 'ORD-UNKNOWN')
    const dateStr = formatOrderDate(order?.date || order?.createdAt)
    const customerName = escapeHtml(order?.address?.name || order?.user?.name || order?.deliveryInfo?.name || 'Customer')
    const phone = escapeHtml(order?.address?.phone || order?.user?.phone || order?.deliveryInfo?.phone || 'N/A')
    const street = escapeHtml(order?.address?.street || order?.deliveryInfo?.address || 'N/A')
    const city = escapeHtml(order?.address?.city || (order?.deliveryInfo?.location === 'outsideDhaka' ? 'Outside Dhaka' : 'Dhaka'))
    
    // Items breakdown
    const items = order?.orderItems || order?.items || []
    let itemsText = ''
    if (items.length > 0) {
        itemsText = items.map((it, idx) => {
            const name = escapeHtml(it.name || it.productName || it.title || `পণ্য #${idx + 1}`)
            const qty = Number(it.quantity) || 1
            const price = formatCurrency(it.price || 0)
            const variant = [it.size, it.color].filter(Boolean).join(', ')
            const variantStr = variant ? ` (${escapeHtml(variant)})` : ''
            return `  ${idx + 1}. <b>${name}</b>${variantStr} — ${qty}টি × ${price}`
        }).join('\n')
    } else {
        itemsText = '  • পণ্য তথ্য বিস্তারিত নেই'
    }

    const subtotal = formatCurrency(order?.subtotal ?? order?.subTotal ?? order?.total ?? 0)
    const shipping = formatCurrency(order?.shippingCost ?? order?.deliveryCharge ?? (order?.deliveryInfo?.location === 'outsideDhaka' ? 120 : 60))
    const discount = (order?.discount && Number(order.discount) > 0) ? formatCurrency(order.discount) : null
    const total = formatCurrency(order?.total ?? order?.amount ?? 0)
    const paymentMethod = escapeHtml(formatPaymentMethod(order?.paymentMethod || order?.payment))
    const orderStatus = escapeHtml(formatOrderStatus(order?.status))

    let message = `🛍️ <b>নতুন অর্ডার এসেছে!</b>\n`
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`
    message += `📦 <b>অর্ডার নং:</b> <code>#${orderId}</code>\n`
    message += `🕒 <b>তারিখ ও সময়:</b> <i>${dateStr}</i>\n`
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`
    message += `👤 <b>গ্রাহকের নাম:</b> <b>${customerName}</b>\n`
    message += `📞 <b>মোবাইল:</b> <code>${phone}</code>\n`
    message += `📍 <b>ঠিকানা:</b> ${street}, ${city}\n`
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`
    message += `🛒 <b>অর্ডারকৃত পণ্যসমূহ:</b>\n${itemsText}\n`
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`
    if (subtotal !== total) {
        message += `💰 <b>সাবটোটাল:</b> ${subtotal}\n`
    }
    message += `🚚 <b>ডেলিভারি চার্জ:</b> ${shipping}\n`
    if (discount) {
        message += `🏷️ <b>ডিসকাউন্ট:</b> -${discount}\n`
    }
    message += `💵 <b>সর্বমোট বিল:</b> <b>${total}</b>\n`
    message += `💳 <b>পেমেন্ট মাধ্যম:</b> ${paymentMethod}\n`
    message += `⚡ <b>স্ট্যাটাস:</b> <code>${orderStatus}</code>\n`

    return message
}

/**
 * Plain text fallback message in case HTML parsing fails
 */
export function buildPlainTextOrderMessage(order) {
    const orderId = order?.id || order?.orderId || 'ORD-UNKNOWN'
    const dateStr = formatOrderDate(order?.date || order?.createdAt)
    const customerName = order?.address?.name || order?.user?.name || order?.deliveryInfo?.name || 'Customer'
    const phone = order?.address?.phone || order?.user?.phone || order?.deliveryInfo?.phone || 'N/A'
    const street = order?.address?.street || order?.deliveryInfo?.address || 'N/A'
    const city = order?.address?.city || (order?.deliveryInfo?.location === 'outsideDhaka' ? 'Outside Dhaka' : 'Dhaka')
    
    const items = order?.orderItems || order?.items || []
    const itemsList = items.map((it, idx) => {
        const name = it.name || it.productName || it.title || `পণ্য #${idx + 1}`
        const qty = Number(it.quantity) || 1
        const price = formatCurrency(it.price || 0)
        const variant = [it.size, it.color].filter(Boolean).join(', ')
        return `  ${idx + 1}. ${name}${variant ? ` (${variant})` : ''} — ${qty}টি × ${price}`
    }).join('\n')

    const total = formatCurrency(order?.total ?? order?.amount ?? 0)
    const payment = formatPaymentMethod(order?.paymentMethod || order?.payment)
    const status = formatOrderStatus(order?.status)

    return `🛍️ নতুন অর্ডার নোটিফিকেশন!\n` +
        `---------------------------------\n` +
        `Order ID: #${orderId}\n` +
        `Time: ${dateStr}\n` +
        `Customer: ${customerName}\n` +
        `Phone: ${phone}\n` +
        `Address: ${street}, ${city}\n` +
        `---------------------------------\n` +
        `Products:\n${itemsList || '  • তথ্য নেই'}\n` +
        `---------------------------------\n` +
        `Total: ${total}\n` +
        `Payment: ${payment}\n` +
        `Status: ${status}`
}

/**
 * Mask bot token for secure transmission to admin UI
 */
export function maskBotToken(token) {
    if (!token || typeof token !== 'string') return ''
    const trimmed = token.trim()
    if (trimmed.length <= 10) return '••••••••'
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex > 0) {
        const prefix = trimmed.slice(0, colonIndex + 1)
        const suffix = trimmed.slice(-4)
        return `${prefix}••••••••${suffix}`
    }
    return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`
}

/**
 * Test Telegram Bot connection
 */
export async function testTelegramConnection(botToken, chatId) {
    if (!botToken?.trim()) {
        return { success: false, error: 'বট টোকেন (Bot Token) প্রয়োজন।' }
    }

    const token = botToken.trim()
    const targetChatId = chatId ? String(chatId).trim() : ''

    try {
        // 1. Verify bot identity via getMe
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        const meData = await meRes.json().catch(() => ({}))
        if (!meRes.ok || !meData.ok) {
            if (meRes.status === 401 || meData.error_code === 401) {
                return { success: false, error: 'টেলিগ্রাম বট টোকেন সঠিক নয় (401 Unauthorized)। @BotFather থেকে সঠিক টোকেন সংগ্রহ করুন।' }
            }
            return {
                success: false,
                error: `টেলিগ্রাম সংযোগ ব্যর্থ: ${meData.description || 'Invalid Token or Telegram API unreachable'}`,
            }
        }

        const botInfo = meData.result

        // 2. If Chat ID is provided, send a ping message
        if (targetChatId) {
            const pingController = new AbortController()
            const pingTimeoutId = setTimeout(() => pingController.abort(), 6000)

            const pingText = `🔔 <b>Gocart Order Automation Connected!</b>\n\nটেলিগ্রাম বটের সাথে আপনার ওয়েবসাইটের সফল সংযোগ স্থাপিত হয়েছে।\n\n🤖 <b>Bot Name:</b> @${botInfo.username}\n🕒 <b>Time:</b> ${formatOrderDate(new Date())}\n\nএখন থেকে প্রতিটি নতুন অর্ডারের তথ্য সরাসরি এই চ্যাটে আসবে।`

            const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: pingText,
                    parse_mode: 'HTML',
                }),
                signal: pingController.signal,
            })
            clearTimeout(pingTimeoutId)

            const sendData = await sendRes.json().catch(() => ({}))
            if (!sendRes.ok || !sendData.ok) {
                if (sendRes.status === 403 || sendData.error_code === 403) {
                    return {
                        success: false,
                        bot: botInfo,
                        error: `বট ভ্যালিড (@${botInfo.username}), কিন্তু চ্যাটে মেসেজ পাঠানো যায়নি: বটটিকে আপনার গ্রুপে অ্যাড করে মেসেজ পাঠানোর পারমিশন দিন, অথবা পার্সোনাল চ্যাটে /start চাপুন।`,
                    }
                }
                return {
                    success: false,
                    bot: botInfo,
                    error: `বট ভেরিফাইড (@${botInfo.username}), কিন্তু চ্যাটে মেসেজ পাঠানো যায়নি: ${sendData.description || 'Chat ID invalid'}`,
                }
            }
        }

        return {
            success: true,
            bot: {
                id: botInfo.id,
                username: botInfo.username,
                firstName: botInfo.first_name,
            },
            message: targetChatId 
                ? `@${botInfo.username}-এর সাথে সফলভাবে কানেক্টেড এবং টেস্ট মেসেজ পাঠানো হয়েছে!`
                : `@${botInfo.username} ভ্যালিড। টেস্ট মেসেজ পাঠাতে Chat ID প্রদান করুন।`
        }

    } catch (err) {
        if (err.name === 'AbortError') {
            return { success: false, error: 'টেলিগ্রাম সার্ভারে রিকোয়েস্ট টাইমআউট হয়েছে (৬ সেকেন্ড)।' }
        }
        return { success: false, error: err.message || 'টেলিগ্রাম সংযোগ ব্যর্থ হয়েছে।' }
    }
}

/**
 * Send new order notification to Telegram (Safe, Non-blocking, Idempotent, Fallback-enabled)
 * 
 * @param {Object} order - Full order object
 * @param {Object} settings - Telegram settings ({ enabled, botToken, chatId, includeActionButtons })
 * @param {string} origin - Origin URL for action buttons
 * @param {Object} [options] - Optional flags ({ force: boolean })
 */
export async function sendTelegramOrderNotification(order, settings = {}, origin = '', options = {}) {
    const botToken = settings?.botToken?.trim()
    const chatId = settings?.chatId ? String(settings.chatId).trim() : ''

    if (!settings?.enabled || !botToken || !chatId) {
        return { success: false, skipped: true, reason: 'Telegram integration is disabled or not fully configured.' }
    }

    // Duplicate Notification Prevention (unless forced re-sync)
    const existingStatus = order?._integrations?.telegram?.status
    if (existingStatus === 'SUCCESS' && !options.force) {
        return {
            success: true,
            skipped: true,
            duplicate: true,
            message: 'Duplicate notification prevented: Order has already been notified to Telegram.',
            messageId: order._integrations.telegram.messageId,
        }
    }

    try {
        const orderId = order?.id || order?.orderId || ''
        const phone = order?.address?.phone || order?.user?.phone || order?.deliveryInfo?.phone || ''

        // Build inline keyboard action buttons
        const adminUrl = origin ? `${origin}/admin/orders` : 'https://ourstorebd.shop/admin/orders'
        const inlineKeyboard = []
        const row = []

        if (settings?.includeActionButtons !== false) {
            row.push({
                text: '🛒 View Order in Admin',
                url: adminUrl,
            })
            if (phone) {
                const cleanPhone = phone.replace(/[^0-9+]/g, '')
                if (cleanPhone.length >= 10) {
                    row.push({
                        text: '📞 Call Customer',
                        url: `tel:${cleanPhone}`,
                    })
                }
            }
        }

        if (row.length > 0) {
            inlineKeyboard.push(row)
        }

        // Try primary HTML message
        let textToSend = buildTelegramOrderMessage(order)
        let parseMode = 'HTML'

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6500)

        let res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: textToSend,
                parse_mode: parseMode,
                disable_web_page_preview: true,
                reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined,
            }),
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        let data = await res.json().catch(() => ({}))

        // FALLBACK: If HTML parse error occurred, retry immediately with plain text
        if (!res.ok && data?.description && (
            data.description.includes('can\'t parse entities') ||
            data.description.includes('entity') ||
            data.description.includes('HTML')
        )) {
            console.warn('[Telegram] HTML formatting rejected by Telegram. Retrying with plain text fallback...')
            const fallbackController = new AbortController()
            const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 6500)

            res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: buildPlainTextOrderMessage(order),
                    disable_web_page_preview: true,
                    reply_markup: inlineKeyboard.length > 0 ? { inline_keyboard: inlineKeyboard } : undefined,
                }),
                signal: fallbackController.signal,
            })
            clearTimeout(fallbackTimeoutId)
            data = await res.json().catch(() => ({}))
        }

        if (!res.ok || !data.ok) {
            let errorMsg = data.description || `HTTP ${res.status} Error`
            if (res.status === 429) {
                const retryAfter = data.parameters?.retry_after || 5
                errorMsg = `Telegram rate limit hit. Retry after ${retryAfter}s.`
            } else if (res.status === 401) {
                errorMsg = 'Invalid Bot Token (401 Unauthorized).'
            } else if (res.status === 403) {
                errorMsg = 'Bot was blocked by user or lacks group write permissions (403 Forbidden).'
            }

            return {
                success: false,
                error: errorMsg,
                errorCode: data.error_code || res.status,
            }
        }

        return {
            success: true,
            messageId: data.result?.message_id,
            timestamp: new Date().toISOString(),
        }

    } catch (err) {
        return {
            success: false,
            error: err.name === 'AbortError' ? 'Telegram request timed out (6.5s)' : err.message,
        }
    }
}
