'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const { user } = useAuth();
    const { isSidebarOpen, closeSidebar } = useUI();
    const pathname = usePathname();

    // Links for Guest Users
    const guestLinks = [
        { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { href: '/features', label: 'Features', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { href: '/pricing', label: 'Pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { href: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    const baseMemberLinks = [
        { href: '/dashboard/member', label: 'Overview', icon: 'M4 6h16M4 12h16m-7 6h7' },
        { href: '/dashboard/member/workouts', label: 'Workouts', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { href: '/dashboard/member/book-trainer', label: 'Book Trainer', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { href: '/dashboard/member/progress', label: 'Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { href: '/dashboard/member/equipment', label: 'Equipment', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    ];

    if (user?.memberProfile?.membershipType === 'ELITE') {
        baseMemberLinks.push({ href: '/dashboard/member/nutrition', label: 'Nutrition Plan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' });
    }

    const roleLinks = user ? {
        MEMBER: baseMemberLinks,
        TRAINER: [
            { href: '/dashboard/trainer', label: 'Overview', icon: 'M4 6h16M4 12h16m-7 6h7' },
            { href: '/dashboard/trainer/manage-workouts', label: 'Plan Workouts', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            { href: '/dashboard/trainer/schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ],
        ADMIN: [
            { href: '/dashboard/admin', label: 'Overview', icon: 'M4 6h16M4 12h16m-7 6h7' },
            { href: '/dashboard/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { href: '/dashboard/admin/equipment', label: 'Equipment', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { href: '/dashboard/admin/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        ]
    } : {};

    // @ts-ignore
    const activeLinks = user ? (roleLinks[user.role] || []) : guestLinks;
    const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'));

    return (
        <>
            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={closeSidebar}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity"
                />
            )}

            {/* Sidebar Drawer */}
            <aside
                className={`fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[#050505] border-r border-white/10 z-[100] transform transition-transform duration-300 ease-in-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-[var(--header-height)] flex items-center px-6 border-b border-white/5">
                    <span className="text-xl font-bold tracking-tight text-white">Smart<span className="text-indigo-500">Gym</span></span>
                    <button onClick={closeSidebar} className="ml-auto text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <nav className="p-4 space-y-1 mt-4">
                    {activeLinks.map((link: any) => {
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeSidebar}
                                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                {link.icon && (
                                    <svg style={{ width: '20px', height: '20px' }} className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path></svg>
                                )}
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-[#080808]">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Link href="/login" onClick={closeSidebar} className="block w-full py-2.5 text-center text-sm font-medium text-gray-300 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                                Log In
                            </Link>
                            <Link href="/register" onClick={closeSidebar} className="block w-full py-2.5 text-center text-sm font-bold text-black bg-white rounded-lg hover:bg-gray-200 transition-colors">
                                Sign Up Free
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
