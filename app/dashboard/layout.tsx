import Sidebar from '../components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Sidebar />
            <div className="p-8 md:p-12 animate-fade-in w-full">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
