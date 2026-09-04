import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-icon.png" />
                <OrganizationJsonLd />
                <WebsiteJsonLd />
            </head>
            <body className={`${outfit.className} antialiased selection:bg-green-100 selection:text-green-900`}>
                <StoreProvider>
                    <Toaster position="top-center" reverseOrder={false} />
                    {children}
                </StoreProvider>
            </body>
        </html>
    );
}
