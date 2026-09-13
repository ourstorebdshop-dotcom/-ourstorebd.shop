import { Suspense } from "react";
import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/JsonLd";
import TrackingManager from "@/components/tracking/TrackingManager";
import "./globals.css";

const outfit = Outfit({ 
    subsets: ["latin"], 
    weight: ["400", "500", "600", "700"],
    display: "swap",
    preload: true,
});

export const metadata = {
    title: {
        default: "Our Store BD - Best Electronics & Gadgets Shop in Bangladesh",
        template: "%s | Our Store BD",
    },
    description: "Best electronics, gadgets & smart appliances at Our Store BD – making life easy! Shop authentic smartphones, smartwatches, headphones, earbuds, and speakers with official warranty & fast Cash on Delivery all across Bangladesh.",
    keywords: [
        // English keywords
        "Our Store BD", "electronics Bangladesh", "gadget shop Dhaka", "online shopping BD",
        "smartphones Bangladesh", "smartwatches BD", "wireless headphones", "Bluetooth earbuds",
        "Bluetooth speakers", "best electronics shop BD", "ourstorebd", "authentic gadgets BD",
        "cash on delivery Bangladesh", "tech store Dhaka", "electronics accessories BD",
        // Bengali keywords
        "আওয়ার স্টোর বিডি", "ইলেকট্রনিক্স বাংলাদেশ", "অনলাইন শপিং বিডি", "গ্যাজেট শপ ঢাকা",
        "স্মার্টফোন দাম", "স্মার্টওয়াচ বিডি", "হেডফোন বাংলাদেশ", "ব্লুটুথ এয়ারবাডস",
        "ব্লুটুথ স্পিকার", "সেরা ইলেকট্রনিক্স দোকান", "ক্যাশ অন ডেলিভারি বাংলাদেশ"
    ],
    authors: [{ name: "Our Store BD", url: "https://ourstorebd.shop" }],
    creator: "Our Store BD",
    publisher: "Our Store BD",
    metadataBase: new URL("https://ourstorebd.shop"),
    alternates: {
        canonical: "/",
        languages: {
            "bn-BD": "/",
            "en-US": "/"
        }
    },
    openGraph: {
        title: "Our Store BD - Best Electronics & Gadgets in Bangladesh",
        description: "Shop 100% authentic electronics, smartwatches, headphones & smart gadgets in Bangladesh with fast nationwide delivery & easy 7-day return!",
        url: "https://ourstorebd.shop",
        siteName: "Our Store BD",
        locale: "bn_BD",
        type: "website",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Our Store BD - Leading Electronics & Gadgets Shop in Bangladesh",
            }
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Our Store BD - Best Electronics & Gadgets in Bangladesh",
        description: "Shop 100% authentic electronics, smartwatches, headphones & accessories with fast delivery across Bangladesh.",
        images: ["/og-image.jpg"],
        creator: "@ourstorebd",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    verification: {
        google: "", // Enter Google Search Console verification code here
    },
    category: "ecommerce",
};

export const viewport = {
    themeColor: "#10b981",
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({ children }) {
    return (
        <html lang="bn" className="scroll-smooth">
            <head>
                {/* Preconnect to critical third-party domains */}
                <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://res.cloudinary.com" />
                <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
                <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://connect.facebook.net" />
                <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-icon.png" />
                {/* Instant zero-flash favicon sync before React hydration */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var raw = localStorage.getItem('gocart_favicon_settings');
                                    if (raw) {
                                        var parsed = JSON.parse(raw);
                                        if (parsed && parsed.faviconUrl) {
                                            var icon = document.querySelector("link[rel*='icon']");
                                            if (icon) icon.href = parsed.faviconUrl;
                                            var apple = document.querySelector("link[rel='apple-touch-icon']");
                                            if (apple && parsed.appleTouchIconUrl) apple.href = parsed.appleTouchIconUrl;
                                        }
                                    }
                                } catch(e) {}
                            })();
                        `,
                    }}
                />
                <OrganizationJsonLd />
                <WebsiteJsonLd />
            </head>
            <body className={`${outfit.className} antialiased selection:bg-green-100 selection:text-green-900`}>
                <StoreProvider>
                    <Suspense fallback={null}>
                        <TrackingManager />
                    </Suspense>
                    <Toaster position="top-center" reverseOrder={false} />
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
