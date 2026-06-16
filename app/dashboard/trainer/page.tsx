'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TrainerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ upcomingSessions: 0, activeClients: 0, pendingBookings: 0 });

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data));
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="heading-hero text-4xl">Hello, {user?.name}</h1>
                    <p className="text-gray-400 mt-1">Ready to train your clients?</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/profile" className="btn btn-outline px-6">Profile</Link>
                    <Link href="/dashboard/trainer/schedule" className="btn btn-primary px-6">View Schedule</Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="card glass-panel p-6 flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">📅</span>
                    </div>
                    <h3 className="text-gray-400 font-medium">Upcoming Sessions</h3>
                    <div className="text-4xl font-bold text-white mt-2">{stats.upcomingSessions}</div>
                    <div className="text-xs text-green-400 mt-2 font-medium">Today & Future</div>
                </div>

                <div className="card glass-panel p-6 flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">👥</span>
                    </div>
                    <h3 className="text-gray-400 font-medium">Pending Requests</h3>
                    <div className="text-4xl font-bold text-white mt-2">{stats.pendingBookings}</div>
                    <div className="text-xs text-yellow-400 mt-2 font-medium">Needs Approval</div>
                </div>

                <div className="card glass-panel p-6 flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">⭐</span>
                    </div>
                    <h3 className="text-gray-400 font-medium">Rating</h3>
                    <div className="text-4xl font-bold text-white mt-2">{user?.trainerProfile?.rating ? user.trainerProfile.rating.toFixed(1) : 'N/A'}</div>
                    <div className="text-xs text-gray-500 mt-2 font-medium">{user?.trainerProfile?.ratingCount || 0} Reviews</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/trainer/manage-workouts" className="card glass-panel p-6 hover:bg-white/10 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💪</div>
                    <h3 className="font-bold text-white text-lg">Create Workout Plan</h3>
                    <p className="text-gray-400 text-sm mt-2">Design new routines for your clients.</p>
                </Link>

                <Link href="/dashboard/trainer/schedule" className="card glass-panel p-6 hover:bg-white/10 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📆</div>
                    <h3 className="font-bold text-white text-lg">Manage Schedule</h3>
                    <p className="text-gray-400 text-sm mt-2">Accept bookings and manage slots.</p>
                </Link>

                <Link href="/dashboard/profile" className="card glass-panel p-6 hover:bg-white/10 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
                    <h3 className="font-bold text-white text-lg">Trainer Profile</h3>
                    <p className="text-gray-400 text-sm mt-2">Update your specialty and availability.</p>
                </Link>
            </div>
        </div>
    );
}
