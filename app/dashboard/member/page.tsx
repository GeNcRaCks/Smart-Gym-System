'use client';

import { useEffect, useState } from 'react';

export default function MemberDashboard() {
    const [stats, setStats] = useState({ memberStreak: 0 });

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data));
    }, []);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4 animate-fade-in">
                <div>
                    <p className="text-caption text-indigo-400 mb-2">OVERVIEW</p>
                    <h1 className="heading-section">Welcome Back, Athlete.</h1>
                </div>
                <div className="card-premium py-4 px-6 flex items-center gap-4">
                    <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Streak</span>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <span className="text-xl font-bold text-white">{stats.memberStreak} Days</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid-cols-3 mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="card-premium">
                    <h3 className="heading-card text-gray-400 !text-sm !uppercase !tracking-widest">Next Session</h3>
                    <p className="text-3xl font-bold text-white mt-4 mb-2">Leg Hypertrophy</p>
                    <p className="text-body text-sm mb-6">Today, 5:00 PM • 60 mins</p>
                    <button className="btn btn-outline w-full h-12 text-sm">Start Workout</button>
                </div>

                <div className="card-premium">
                    <h3 className="heading-card text-gray-400 !text-sm !uppercase !tracking-widest">Weekly Load</h3>
                    <div className="flex items-end gap-2 mt-4 mb-2">
                        <p className="text-4xl font-bold text-white">85%</p>
                        <span className="text-indigo-400 text-sm mb-2 font-medium">Optimal</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 mt-4">
                        <div className="bg-indigo-500 h-1 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>

                <div className="card-premium">
                    <h3 className="heading-card text-gray-400 !text-sm !uppercase !tracking-widest">Recovery</h3>
                    <p className="text-3xl font-bold text-white mt-4 mb-2">92/100</p>
                    <p className="text-body text-sm text-green-400">Ready for Peak Impact</p>
                </div>
            </div>

            {/* Recent Activity / Featured */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="heading-section mb-8">Featured Protocols</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="card-premium group cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="aspect-video w-full bg-gray-800 rounded-xl mb-6 overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1581009137042-c552e485697a?q=80&w=800&auto=format&fit=crop"
                                alt="Workout"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-indigo-500/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded">Hypertrophy</span>
                            </div>
                        </div>
                        <h3 className="heading-card">Push (Chest & Triceps)</h3>
                        <p className="text-body text-sm mb-4">High volume compound movements for maximum muscle growth.</p>
                    </div>

                    <div className="card-premium group cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="aspect-video w-full bg-gray-800 rounded-xl mb-6 overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop"
                                alt="Workout"
                                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-purple-500/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded">Strength</span>
                            </div>
                        </div>
                        <h3 className="heading-card">Posterior Chain Power</h3>
                        <p className="text-body text-sm mb-4">Deadlift focus session to build raw strength and stability.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
