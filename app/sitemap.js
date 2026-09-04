import { productDummyData } from "@/assets/assets";

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ourstorebd.shop";
    const currentDate = new Date().toISOString();

    // Static core pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/shop`,
            lastModified: currentDate,
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.4,
        },
    ];

    // Dynamic product pages
    const productPages = (productDummyData || []).map((product) => {
        let lastMod = currentDate;
        if (product.updatedAt) {
            try {
                lastMod = new Date(product.updatedAt).toISOString();
            } catch (e) {
                lastMod = currentDate;
            }
        }
        return {
            url: `${baseUrl}/product/${product.id}`,
            lastModified: lastMod,
            changeFrequency: "weekly",
            priority: 0.85,
        };
    });

    return [...staticPages, ...productPages];
}
