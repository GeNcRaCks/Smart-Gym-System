'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalUsers: 0, activeMembers: 0, trainers: 0, totalRevenue: 0 });

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data));
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="heading-lg text-white">Admin Dashboard</h1>
                <div className="text-sm text-gray-400">System Overview</div>
            </div>

            {/* Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="card glass-panel p-6">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Users</h3>
                    <div className="text-4xl font-bold text-white mt-2">{stats.totalUsers}</div>
                </div>
                <div className="card glass-panel p-6">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Active Members</h3>
                    <div className="text-4xl font-bold text-white mt-2">{stats.activeMembers}</div>
                </div>
                <div className="card glass-panel p-6">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Trainers</h3>
                    <div className="text-4xl font-bold text-white mt-2">{stats.trainers}</div>
                </div>
                <div className="card glass-panel p-6">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Revenue</h3>
                    <div className="text-4xl font-bold text-green-400 mt-2">PKR {stats.totalRevenue}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/admin/users" className="card glass-panel p-6 hover:bg-white/10 transition-colors">
                    <div className="text-3xl mb-4 text-indigo-400">👥</div>
                    <h3 className="font-bold text-white text-lg">Manage Users</h3>
                    <p className="text-gray-400 text-sm mt-2">View, edit, or remove system users.</p>
                </Link>
                <Link href="/dashboard/admin/payments" className="card glass-panel p-6 hover:bg-white/10 transition-colors">
                    <div className="text-3xl mb-4 text-green-400">💳</div>
                    <h3 className="font-bold text-white text-lg">Payments</h3>
                    <p className="text-gray-400 text-sm mt-2">Review pending transfers and confirm member payments.</p>
                </Link>
                <Link href="/dashboard/admin/equipment" className="card glass-panel p-6 hover:bg-white/10 transition-colors">
                    <div className="text-3xl mb-4 text-blue-400">🏋️</div>
                    <h3 className="font-bold text-white text-lg">Equipment</h3>
                    <p className="text-gray-400 text-sm mt-2">Track inventory and maintenance.</p>
                </Link>
                <Link href="/dashboard/admin/reports" className="card glass-panel p-6 hover:bg-white/10 transition-colors">
                    <div className="text-3xl mb-4 text-purple-400">📈</div>
                    <h3 className="font-bold text-white text-lg">Reports</h3>
                    <p className="text-gray-400 text-sm mt-2">Generate financial and health reports.</p>
                </Link>
            </div>
        </div>
    );
}
