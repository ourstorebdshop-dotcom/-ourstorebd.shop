export default function manifest() {
    return {
        name: "Our Store BD - Best Electronics & Gadgets Shop",
        short_name: "Our Store BD",
        description: "Best electronics & appliances in Bangladesh. Shop authentic smart gadgets, headphones, smartwatches with warranty and fast delivery.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#10b981",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
            },
        ],
    };
}
