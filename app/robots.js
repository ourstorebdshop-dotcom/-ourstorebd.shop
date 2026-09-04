export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ourstorebd.shop";

    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/shop", "/about", "/contact", "/product/*"],
                disallow: [
                    "/admin",
                    "/admin/*",
                    "/profile",
                    "/profile/*",
                    "/cart",
                    "/orders",
                    "/api/*",
                    "/_next/*",
                ],
            },
            {
                userAgent: "Googlebot",
                allow: ["/", "/shop", "/about", "/contact", "/product/*"],
                disallow: [
                    "/admin",
                    "/admin/*",
                    "/profile",
                    "/profile/*",
                    "/cart",
                    "/orders",
                    "/api/*",
                ],
            },
            {
                userAgent: "Googlebot-Image",
                allow: ["/"],
                disallow: ["/admin"],
            }
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    };
}
