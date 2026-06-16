'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { toggleSidebar } = useUI();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Search Logic
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }

        // If on a specific search-enabled page, just update params
        if (pathname.includes('/dashboard/member/workouts') || pathname.includes('/dashboard/admin/users')) {
            router.replace(`${pathname}?${params.toString()}`);
        } else {
            // Global search - redirect to generic search page? For now, let's keep it context aware or do nothing if not on a list page.
            // Or redirect to workouts as a default "search" location if logged in?
            // Let's just log for now as global search isn't fully defined.
            console.log("Global search:", term);
        }
    }, 300);

    // Determine Placeholder based on page
    const getSearchPlaceholder = () => {
        if (pathname.includes('/workouts')) return 'Search workouts (e.g. HIIT, Strength)...';
        if (pathname.includes('/users')) return 'Search users by name or email...';
        return 'Search...';
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
            {/* Use flex logic with w-full and px-6 for full screen justification */}
            <div className="w-full h-full px-8 flex items-center justify-between">

                {/* LEFT: Logo & Menu */}
                <div className="flex items-center gap-4 min-w-[200px]">
                    {/* Menu Button */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        aria-label="Open Menu"
                    >
                        <svg style={{ width: '24px', height: '24px' }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>

                    <Link href={user ? (user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'TRAINER' ? '/dashboard/trainer' : '/dashboard/member') : '/'} className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                            <svg style={{ width: '22px', height: '22px' }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">Smart<span className="text-indigo-500">Gym</span></span>
                    </Link>
                </div>

                {/* CENTER: Search Bar - Only show if logged in or explicitly needed */}
                <div className="flex-1 flex justify-center max-w-2xl px-4">
                    {!user ? (
                        /* Public Nav Links */
                        <div className="hidden md:flex gap-10 justify-center w-full">
                            {['Features', 'Pricing', 'About'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase()}`}
                                    className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors hover:underline decoration-indigo-500 underline-offset-8"
                                >
                                    {item}
                                </Link>
                            ))}
                        </div>
                    ) : pathname.includes('/dashboard/member/workouts') ? (
                        <div className="w-full relative hidden md:block group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg style={{ width: '18px', height: '18px' }} className="text-gray-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                onChange={(e) => handleSearch(e.target.value)}
                                defaultValue={searchParams.get('search')?.toString()}
                                className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-white/5 text-gray-200 placeholder-gray-500 focus:outline-none focus:bg-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all shadow-inner"
                                placeholder={getSearchPlaceholder()}
                            />
                        </div>
                    ) : null}
                </div>

                {/* RIGHT: Actions */}
                <div className="flex justify-end items-center gap-4 min-w-[200px]">
                    {!user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block">Log In</Link>
                            <Link href="/register" className="btn btn-primary !h-11 !px-6 !text-sm whitespace-nowrap shadow-xl shadow-white/10">
                                Join Free
                            </Link>
                        </div>
                    ) : (
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 pl-3 py-1.5 pr-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                            >
                                <div className="text-right hidden xl:block">
                                    <p className="text-sm font-bold text-white leading-none group-hover:text-indigo-400 transition-colors">{user.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mt-1 group-hover:text-gray-400">{user.role}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold border-2 border-[#111] shadow-lg ring-1 ring-white/10">
                                    {user.name.charAt(0)}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-3 w-64 rounded-xl shadow-2xl bg-[#0a0a0a] border border-white/10 ring-1 ring-white/5 focus:outline-none z-50 overflow-hidden animate-fade-in data-[state=open]:animate-in origin-top-right">
                                    <div className="p-3 border-b border-white/5 bg-white/5">
                                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>
                                    <div className="py-2">
                                        {user.role === 'MEMBER' && (
                                            <Link href="/pricing" className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-indigo-400 transition-colors">
                                                <svg style={{ width: '18px', height: '18px' }} className="mr-3 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                Upgrade Membership
                                            </Link>
                                        )}
                                        <Link href="/dashboard/profile" className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-indigo-400 transition-colors">
                                            <svg style={{ width: '18px', height: '18px' }} className="mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            Profile
                                        </Link>
                                        <button onClick={() => logout()} className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                                            <svg style={{ width: '18px', height: '18px' }} className="mr-3 text-red-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
