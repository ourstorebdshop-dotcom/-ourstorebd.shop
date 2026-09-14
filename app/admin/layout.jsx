import AdminLayout from "@/components/admin/AdminLayout";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
    title: "Admin Panel | Our Store BD",
    description: "Our Store BD - Admin Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
