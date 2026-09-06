import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function PublicLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <header>
                <Banner />
                <Navbar />
            </header>
            <main className="flex-1 pb-20 sm:pb-0">
                {children}
            </main>
            <Footer />
            <MobileBottomNav />
        </div>
    );
}
