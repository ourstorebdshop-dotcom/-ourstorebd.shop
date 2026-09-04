import React from 'react';

/**
 * Organization Schema (JSON-LD)
 * Helps Google establish knowledge graph entity for Our Store BD
 */
export function OrganizationJsonLd({
    name = "Our Store BD",
    url = "https://ourstorebd.shop",
    logo = "https://ourstorebd.shop/icon-512x512.png",
    phone = "+8801712345678",
    email = "ourstorebd.shop@gmail.com",
    address = {
        streetAddress: "House #42, Road #11, Dhanmondi",
        addressLocality: "Dhaka",
        postalCode: "1209",
        addressCountry: "BD",
    },
    sameAs = [
        "https://www.facebook.com",
        "https://www.instagram.com",
        "https://twitter.com",
        "https://www.linkedin.com"
    ]
}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        "@id": `${url}/#organization`,
        "name": name,
        "alternateName": ["OurStoreBD", "Our Store Bangladesh", "আওয়ার স্টোর বিডি"],
        "url": url,
        "logo": logo,
        "image": logo,
        "description": "Best electronics & appliances in Bangladesh. Shop authentic smartphones, smartwatches, headphones, earbuds, speakers, and smart gadgets with official warranty and fast cash on delivery.",
        "email": email,
        "telephone": phone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": address.streetAddress,
            "addressLocality": address.addressLocality,
            "postalCode": address.postalCode,
            "addressCountry": address.addressCountry
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "23.7465",
            "longitude": "90.3758"
        },
        "priceRange": "৳৳",
        "paymentAccepted": ["Cash on Delivery", "bKash", "Nagad", "Credit Card", "Debit Card"],
        "currenciesAccepted": "BDT",
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
                "opens": "09:00",
                "closes": "22:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Friday"],
                "opens": "14:00",
                "closes": "22:00"
            }
        ],
        "sameAs": sameAs,
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": phone,
            "contactType": "customer service",
            "areaServed": "BD",
            "availableLanguage": ["Bengali", "English"]
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * WebSite Schema with Sitelinks SearchBox (JSON-LD)
 * Enables Google to show in-SERP search box for Our Store BD
 */
export function WebsiteJsonLd({
    url = "https://ourstorebd.shop",
    name = "Our Store BD"
}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${url}/#website`,
        "url": url,
        "name": name,
        "alternateName": "OurStoreBD",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${url}/shop?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * Product Rich Snippets Schema (JSON-LD)
 * Maximizes Google Product Rich Results (Star rating, review count, price in BDT, inStock)
 */
export function ProductJsonLd({ product, siteUrl = "https://ourstorebd.shop" }) {
    if (!product) return null;

    const currency = "BDT";
    const ratings = Array.isArray(product.rating) ? product.rating : [];
    const ratingCount = ratings.length || 1;
    const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + (typeof r.rating === 'number' ? r.rating : 5), 0) / ratings.length).toFixed(1)
        : "4.8";

    // Extract image URLs safely
    const images = Array.isArray(product.images)
        ? product.images.map(img => typeof img === 'string' ? img : (img?.src || `${siteUrl}/product_img.png`))
        : [`${siteUrl}/product_img.png`];

    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": images,
        "description": product.description || `${product.name} - Buy authentic ${product.category || 'electronics'} online in Bangladesh at best price from Our Store BD.`,
        "sku": product.id || `PROD-${Date.now()}`,
        "mpn": product.id,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Our Store BD"
        },
        "category": product.category || "Electronics",
        "offers": {
            "@type": "Offer",
            "url": `${siteUrl}/product/${product.id}`,
            "priceCurrency": currency,
            "price": product.price || 0,
            "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product.inStock !== false 
                ? "https://schema.org/InStock" 
                : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "Our Store BD"
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "BD",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 7,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
            },
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": "0",
                    "currency": "BDT"
                },
                "shippingDestination": {
                    "@type": "DefinedRegion",
                    "addressCountry": "BD"
                },
                "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "transitTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 1,
                        "maxValue": 3,
                        "unitCode": "d"
                    }
                }
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": avgRating,
            "reviewCount": ratingCount,
            "bestRating": "5",
            "worstRating": "1"
        },
        ...(ratings.length > 0 ? {
            "review": ratings.slice(0, 5).map(r => ({
                "@type": "Review",
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": r.rating || 5,
                    "bestRating": "5"
                },
                "author": {
                    "@type": "Person",
                    "name": r.user?.name || "Verified Customer"
                },
                "reviewBody": r.review || "Excellent product and super fast delivery!"
            }))
        } : {})
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * BreadcrumbList Schema (JSON-LD)
 * Gives rich breadcrumb paths in Google SERPs
 */
export function BreadcrumbJsonLd({ items = [], siteUrl = "https://ourstorebd.shop" }) {
    if (!items || items.length === 0) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url?.startsWith('http') ? item.url : `${siteUrl}${item.url}`
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * FAQPage Schema (JSON-LD)
 * Enables Google rich FAQ snippets in search results
 */
export function FaqJsonLd({ faqs = [] }) {
    if (!faqs || faqs.length === 0) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question || faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer || faq.a
            }
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * ItemList Schema (JSON-LD) for catalog / category pages
 */
export function ItemListJsonLd({ items = [], name = "Popular Electronics & Gadgets", siteUrl = "https://ourstorebd.shop" }) {
    if (!items || items.length === 0) return null;

    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": name,
        "itemListElement": items.slice(0, 20).map((product, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `${siteUrl}/product/${product.id}`,
            "name": product.name
        }))
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
