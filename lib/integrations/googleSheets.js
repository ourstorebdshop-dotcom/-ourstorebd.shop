/**
 * Google Sheets Order Integration Client (Production-Hardened)
 * 
 * Hardening features:
 * 1. Webhook Authentication (authSecret) to prevent unauthorized Sheet manipulation
 * 2. Order Row Upsert: Searches Column A for Order ID; updates existing row if present, appends if new (Zero duplicate rows)
 * 3. Connection Test verification with Sheet capacity diagnostics
 * 4. Safe timeout protection (8s) & non-blocking execution
 */

/**
 * 1-Click Google Apps Script template with Security Token & Upsert logic
 */
export function buildAppsScriptTemplate(authSecret = '') {
    return `/**
 * Gocart Google Sheets Order Automation Webhook (Production Ready)
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to: Extensions > Apps Script
 * 3. Delete any existing code, paste this code completely
 * 4. (Optional) Set AUTH_SECRET below if you want extra webhook security
 * 5. Click 'Save' (Floppy icon)
 * 6. Click 'Deploy' > 'New deployment'
 * 7. Select type: 'Web app'
 * 8. Set 'Execute as': 'Me'
 * 9. Set 'Who has access': 'Anyone'
 * 10. Click 'Deploy' and copy the 'Web app URL' into Gocart Admin Panel!
 */

// Webhook Security Secret (Keep empty to allow without secret, or set for protection)
var AUTH_SECRET = "${authSecret || ''}";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No payload received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 1. Security Check
    if (AUTH_SECRET && AUTH_SECRET.trim() !== '') {
      var providedSecret = data.authSecret || '';
      if (providedSecret !== AUTH_SECRET) {
        return ContentService.createTextOutput(JSON.stringify({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Unauthorized: Invalid or missing authSecret'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. Connection Test Ping
    if (data.action === 'TEST_CONNECTION') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Google Sheets connection verified successfully!',
        sheetName: sheet.getName(),
        totalRows: sheet.getLastRow(),
        securityActive: Boolean(AUTH_SECRET && AUTH_SECRET.trim() !== '')
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Initialize Headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        'Order ID',
        'Date & Time',
        'Customer Name',
        'Phone Number',
        'Delivery Address',
        'Location',
        'Products & Quantity',
        'Total Items',
        'Subtotal (৳)',
        'Delivery Charge (৳)',
        'Discount (৳)',
        'Total Amount (৳)',
        'Payment Method',
        'Order Status'
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#059669'); // Emerald green
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    // 4. Construct Row Data
    var targetOrderId = String(data.orderId || '').trim();
    var newRow = [
      targetOrderId,
      data.date || new Date().toLocaleString(),
      data.customerName || '',
      data.phone || '',
      data.address || '',
      data.location || '',
      data.products || '',
      Number(data.totalQuantity) || 1,
      Number(data.subtotal) || 0,
      Number(data.deliveryCharge) || 0,
      Number(data.discount) || 0,
      Number(data.totalAmount) || 0,
      data.paymentMethod || 'COD',
      data.orderStatus || 'ORDER_PLACED'
    ];

    // 5. Duplicate Check & Upsert (Search Column A)
    var lastRow = sheet.getLastRow();
    var existingRowIndex = -1;

    if (lastRow > 1 && targetOrderId) {
      var orderIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < orderIds.length; i++) {
        if (String(orderIds[i][0]).trim() === targetOrderId) {
          existingRowIndex = i + 2; // +2 for 1-based index and header offset
          break;
        }
      }
    }

    if (existingRowIndex > 0) {
      // UPDATE existing row (Re-sync / Status update without duplicates)
      sheet.getRange(existingRowIndex, 1, 1, newRow.length).setValues([newRow]);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        action: 'UPDATED',
        row: existingRowIndex,
        message: 'Order #' + targetOrderId + ' updated on row ' + existingRowIndex
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      // APPEND new order row
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        action: 'CREATED',
        row: sheet.getLastRow(),
        message: 'Order #' + targetOrderId + ' appended on row ' + sheet.getLastRow()
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Gocart Google Sheets Webhook is active and secure.'
  })).setMimeType(ContentService.MimeType.JSON);
}
`
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = buildAppsScriptTemplate()

/**
 * Format Bangladesh local time
 */
function formatSheetDate(dateString) {
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
        return new Date().toISOString()
    }
}

/**
 * Prepare flat JSON object for Google Sheets
 */
export function formatOrderForGoogleSheet(order, authSecret = '') {
    const items = order?.orderItems || order?.items || []
    const productSummary = items.map((it, idx) => {
        const name = it.name || it.productName || it.title || `Item #${idx + 1}`
        const qty = Number(it.quantity) || 1
        const variant = [it.size, it.color].filter(Boolean).join('/')
        return `${name}${variant ? ` (${variant})` : ''} x${qty}`
    }).join('; ')

    const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)

    return {
        action: 'ADD_ORDER',
        authSecret: authSecret || '',
        orderId: String(order?.id || order?.orderId || 'ORD-UNKNOWN').trim(),
        date: formatSheetDate(order?.date || order?.createdAt),
        customerName: String(order?.address?.name || order?.user?.name || order?.deliveryInfo?.name || 'Customer').trim(),
        phone: String(order?.address?.phone || order?.user?.phone || order?.deliveryInfo?.phone || '').trim(),
        address: String(order?.address?.street || order?.deliveryInfo?.address || '').trim(),
        location: String(order?.address?.city || (order?.deliveryInfo?.location === 'outsideDhaka' ? 'Outside Dhaka' : 'Dhaka')).trim(),
        products: productSummary,
        totalQuantity: totalQty || 1,
        subtotal: Number(order?.subtotal ?? order?.subTotal ?? order?.total ?? 0),
        deliveryCharge: Number(order?.shippingCost ?? order?.deliveryCharge ?? (order?.deliveryInfo?.location === 'outsideDhaka' ? 120 : 60)),
        discount: Number(order?.discount ?? 0),
        totalAmount: Number(order?.total ?? order?.amount ?? 0),
        paymentMethod: String(order?.paymentMethod || order?.payment || 'COD').trim(),
        orderStatus: String(order?.status || 'ORDER_PLACED').trim(),
    }
}

/**
 * Test Google Sheets connection
 */
export async function testGoogleSheetsConnection(settings = {}) {
    const webhookUrl = settings.webhookUrl?.trim()
    const authSecret = settings.authSecret?.trim() || ''

    if (!webhookUrl) {
        return { success: false, error: 'গুগল শিট Webhook URL প্রয়োজন।' }
    }

    if (!webhookUrl.startsWith('https://script.google.com/')) {
        return {
            success: false,
            error: 'Webhook URL-টি ভ্যালিড Google Apps Script URL নয় (এটি https://script.google.com/ দিয়ে শুরু হতে হবে)।',
        }
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'TEST_CONNECTION',
                authSecret,
                timestamp: new Date().toISOString(),
            }),
            redirect: 'follow', // Crucial for Google Apps Script 302 redirect!
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        const text = await res.text()
        let data = null
        try {
            data = JSON.parse(text)
        } catch {
            // If it returned HTML (e.g. login or permission error)
            if (text.includes('Google Docs') || text.includes('ServiceLogin') || text.includes('accounts.google.com')) {
                return {
                    success: false,
                    error: 'গুগল শিট পারমিশন এরর: Apps Script Deploy করার সময় "Who has access" অপশনটি "Anyone" সিলেক্ট করা হয়েছে কি না নিশ্চিত করুন।',
                }
            }
            return {
                success: false,
                error: `গুগল সার্ভার থেকে অপ্রত্যাশিত প্রতিক্রিয়া এসেছে: ${text.slice(0, 120)}`,
            }
        }

        if (data?.status === 'success') {
            return {
                success: true,
                message: data.message || 'গুগল শিটের সাথে সফলভাবে সংযোগ স্থাপিত হয়েছে!',
                sheetName: data.sheetName,
                totalRows: data.totalRows,
                securityActive: Boolean(data.securityActive),
            }
        } else {
            return {
                success: false,
                error: data?.message || 'গুগল শিট থেকে এরর রেসপন্স এসেছে।',
                code: data?.code,
            }
        }

    } catch (err) {
        return {
            success: false,
            error: err.name === 'AbortError' ? 'গুগল শিট সার্ভার টাইমআউট হয়েছে (৮ সেকেন্ড)।' : err.message,
        }
    }
}

/**
 * Send order data to Google Sheets (Safe, Non-blocking, Upsert-enabled)
 * 
 * @param {Object} order - Full order object
 * @param {Object} settings - Google Sheets settings
 * @param {Object} [options] - Optional flags ({ force: boolean })
 */
export async function syncOrderToGoogleSheets(order, settings = {}, options = {}) {
    const webhookUrl = settings.webhookUrl?.trim()
    const authSecret = settings.authSecret?.trim() || ''

    if (!settings.enabled || !webhookUrl) {
        return { success: false, skipped: true, reason: 'Google Sheets integration is disabled or Webhook URL missing.' }
    }

    try {
        const payload = formatOrderForGoogleSheet(order, authSecret)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8500)

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow', // Always follow Google 302 redirects
            signal: controller.signal,
        })
        clearTimeout(timeoutId)

        const text = await res.text()
        let data = {}
        try {
            data = JSON.parse(text)
        } catch {
            return {
                success: false,
                error: `Invalid response from Google Sheets webhook: ${text.slice(0, 120)}`,
            }
        }

        if (data.status === 'success') {
            return {
                success: true,
                action: data.action || 'SYNCED', // 'CREATED' or 'UPDATED'
                row: data.row,
                message: data.message || 'Order synced to Google Sheet',
                timestamp: new Date().toISOString(),
            }
        } else {
            return {
                success: false,
                error: data.message || 'Google Sheets script error',
                code: data.code,
            }
        }

    } catch (err) {
        return {
            success: false,
            error: err.name === 'AbortError' ? 'Google Sheets request timed out (8.5s)' : err.message,
        }
    }
}
