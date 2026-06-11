'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else {
                if (user.role === 'ADMIN') router.push('/dashboard/admin');
                else if (user.role === 'TRAINER') router.push('/dashboard/trainer');
                else router.push('/dashboard/member');
            }
        }
    }, [user, loading, router]);

    return <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>;
}
