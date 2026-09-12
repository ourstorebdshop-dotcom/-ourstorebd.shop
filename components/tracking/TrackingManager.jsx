'use client'

import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { logTrackingEvent } from '@/lib/features/tracking/trackingSlice'
import { trackPageView } from '@/lib/tracking/clientTracker'
import { ShieldCheck, X, Check } from 'lucide-react'

export default function TrackingManager() {
    const dispatch = useDispatch()
    const tracking = useSelector(state => state.tracking) || {}
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [consentStatus, setConsentStatus] = useState(null)
    const [isClient, setIsClient] = useState(false)

    const meta = tracking.meta || {}
    const googleAds = tracking.googleAds || {}
    const ga4 = tracking.ga4 || {}
    const gtm = tracking.gtm || {}
    const customScripts = tracking.customScripts || {}
    const consent = tracking.consent || {}

    // Attach tracking config and dispatch function to window for clientTracker.js
    useEffect(() => {
        setIsClient(true)
        if (typeof window !== 'undefined') {
            window.__GOCART_TRACKING_CONFIG__ = tracking
            window.__GOCART_DISPATCH_TRACKING_LOG__ = (entry) => {
                dispatch(logTrackingEvent(entry))
            }

            const savedConsent = localStorage.getItem('gocart_cookie_consent')
            setConsentStatus(savedConsent)
        }
    }, [tracking, dispatch])

    // Route changes -> automatically track PageView
    useEffect(() => {
        if (!isClient) return
        const fullUrl = typeof window !== 'undefined' ? window.location.href : pathname
        trackPageView(fullUrl)
    }, [pathname, searchParams, isClient])

    // Consent handlers
    const handleAcceptConsent = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('gocart_cookie_consent', 'granted')
            setConsentStatus('granted')

            // Update Google Consent Mode v2
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', {
                    ad_storage: 'granted',
                    analytics_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted',
                })
            }

            // Update Meta Pixel consent
            if (typeof window.fbq === 'function') {
                window.fbq('consent', 'grant')
            }
        }
    }

    const handleDeclineConsent = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('gocart_cookie_consent', 'denied')
            setConsentStatus('denied')

            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', {
                    ad_storage: 'denied',
                    analytics_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                })
            }

            if (typeof window.fbq === 'function') {
                window.fbq('consent', 'revoke')
            }
        }
    }

    // Determine Google tag ID (use GA4 or Google Ads conversion ID)
    const primaryGtagId = ga4.enabled && ga4.measurementId ? ga4.measurementId : (googleAds.enabled && googleAds.conversionId ? googleAds.conversionId : null)

    return (
        <>
            {/* ── 1. Google Consent Mode v2 Initialization ───────────────────── */}
            {primaryGtagId && (
                <Script
                    id="google-consent-mode"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('consent', 'default', {
                                'ad_storage': '${consentStatus === 'granted' ? 'granted' : 'denied'}',
                                'analytics_storage': '${consentStatus === 'granted' ? 'granted' : 'denied'}',
                                'ad_user_data': '${consentStatus === 'granted' ? 'granted' : 'denied'}',
                                'ad_personalization': '${consentStatus === 'granted' ? 'granted' : 'denied'}',
                                'wait_for_update': 500
                            });
                        `,
                    }}
                />
            )}

            {/* ── 2. Google Tag (gtag.js) for GA4 & Google Ads ───────────────── */}
            {primaryGtagId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${primaryGtagId}`}
                        strategy="afterInteractive"
                    />
                    <Script
                        id="google-gtag-init"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                ${ga4.enabled && ga4.measurementId ? `gtag('config', '${ga4.measurementId}', { send_page_view: true });` : ''}
                                ${googleAds.enabled && googleAds.conversionId ? `gtag('config', '${googleAds.conversionId}');` : ''}
                            `,
                        }}
                    />
                </>
            )}

            {/* ── 3. Meta Pixel Base Code (with Multi-Pixel Support) ──────────── */}
            {meta.enabled && meta.pixelId && (
                <>
                    <Script
                        id="meta-pixel-init"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                !function(f,b,e,v,n,t,s)
                                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                n.queue=[];t=b.createElement(e);t.async=!0;
                                t.src=v;s=b.getElementsByTagName(e)[0];
                                s.parentNode.insertBefore(t,s)}(window, document,'script',
                                'https://connect.facebook.net/en_US/fbevents.js');
                                ${consentStatus === 'denied' ? `fbq('consent', 'revoke');` : `fbq('consent', 'grant');`}
                                fbq('init', '${meta.pixelId.trim()}');
                                ${meta.pixelId2 && meta.pixelId2.trim() ? `fbq('init', '${meta.pixelId2.trim()}');` : ''}
                                fbq('track', 'PageView');
                            `,
                        }}
                    />
                    <noscript>
                        <img
                            height="1"
                            width="1"
                            style={{ display: 'none' }}
                            src={`https://www.facebook.com/tr?id=${meta.pixelId.trim()}&ev=PageView&noscript=1`}
                            alt=""
                        />
                    </noscript>
                </>
            )}

            {/* ── 4. Google Tag Manager (GTM) Container ─────────────────────── */}
            {gtm.enabled && gtm.containerId && (
                <>
                    <Script
                        id="gtm-container-init"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                                })(window,document,'dataLayer','${gtm.containerId.trim()}');
                            `,
                        }}
                    />
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${gtm.containerId.trim()}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                        />
                    </noscript>
                </>
            )}

            {/* ── 5. Safe Custom Head Scripts ───────────────────────────────── */}
            {customScripts.enabled && customScripts.headScript && (
                <Script
                    id="custom-head-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{ __html: customScripts.headScript }}
                />
            )}

            {/* ── 6. Safe Custom Body Top Scripts ───────────────────────────── */}
            {customScripts.enabled && customScripts.bodyTopScript && (
                <Script
                    id="custom-body-top-script"
                    strategy="lazyOnload"
                    dangerouslySetInnerHTML={{ __html: customScripts.bodyTopScript }}
                />
            )}

            {/* ── 7. Safe Custom Body Bottom Scripts ────────────────────────── */}
            {customScripts.enabled && customScripts.bodyBottomScript && (
                <Script
                    id="custom-body-bottom-script"
                    strategy="lazyOnload"
                    dangerouslySetInnerHTML={{ __html: customScripts.bodyBottomScript }}
                />
            )}

            {/* ── 8. Cookie & Tracking Consent Banner ───────────────────────── */}
            {consent.enabled && isClient && consentStatus === null && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-200/90 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-900">
                                {consent.bannerHeading || 'কুকিজ ও প্রাইভেসি পলিসি'}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {consent.bannerText || 'আপনার কেনাকাটার অভিজ্ঞতা সেরা করতে এবং অফার দেখাতে আমরা নিরাপদ কুকিজ ও ট্র্যাকিং টুল ব্যবহার করি।'}
                            </p>
                            <div className="flex items-center gap-2 mt-3.5">
                                <button
                                    type="button"
                                    onClick={handleAcceptConsent}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                                >
                                    <Check size={14} />
                                    <span>{consent.acceptBtnText || 'সম্মত আছি'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeclineConsent}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition active:scale-95 cursor-pointer"
                                >
                                    <span>{consent.declineBtnText || 'প্রত্যাখ্যান'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
