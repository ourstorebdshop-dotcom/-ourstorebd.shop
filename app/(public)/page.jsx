'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import CustomerRatings from "@/components/CustomerRatings";
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";

const homeFaqs = [
    {
        q: "How fast is delivery for Our Store BD in Bangladesh?",
        a: "We deliver within 24-48 hours in Dhaka city and 48-72 hours across all 64 districts of Bangladesh with real-time parcel tracking."
    },
    {
        q: "Are all electronics and gadgets 100% authentic?",
        a: "Yes! Every single product at Our Store BD is 100% genuine, brand new, and covered by official manufacturer or distributor warranty."
    },
    {
        q: "Is Cash on Delivery (COD) available across Bangladesh?",
        a: "Yes, we provide Cash on Delivery (COD) nationwide. You can inspect your parcel upon delivery before making payment."
    },
    {
        q: "How does the 7-day replacement and return policy work?",
        a: "If your item has any manufacturing defect or difference, contact us within 7 days for a hassle-free replacement or full refund."
    }
];

export default function Home() {
    return (
        <div>
            {/* Schema markup for SEO */}
            <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }]} />
            <FaqJsonLd faqs={homeFaqs} />

            {/* Main Sections (Hero kept intact) */}
            <Hero />
            <LatestProducts />
            <BestSelling />
            <OurSpecs />
            <CustomerRatings />
            <Newsletter />
        </div>
    );
}
