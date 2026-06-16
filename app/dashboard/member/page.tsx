'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

export default function MemberDashboard() {
    const { user } = useAuth();
    const membershipType = user?.memberProfile?.membershipType || 'BASIC';
    const [stats, setStats] = useState({ memberStreak: 0 });
    const [bookings, setBookings] = useState<any[]>([]);
    const [ratingLoading, setRatingLoading] = useState(false);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => setStats(data));
        
        fetch('/api/bookings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBookings(data);
            });
    }, []);

    const unratedBookings = bookings.filter(b => b.status === 'COMPLETED' && !b.isRated);

    const handleRate = async (bookingId: string, rating: number) => {
        setRatingLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating })
            });
            if (res.ok) {
                setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, isRated: true } : b));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit rating');
            }
        } catch(e) {
            alert('Failed to submit rating');
        } finally {
            setRatingLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 animate-fade-in">
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

            {/* Unrated Bookings Prompt */}
            {unratedBookings.length > 0 && (
                <div className="mb-8 animate-fade-in">
                    {unratedBookings.map(booking => (
                        <div key={booking.id} className="card-premium bg-gradient-to-r from-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between border-indigo-500/50 mb-4 gap-4 p-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Rate your session with {booking.trainer?.user?.name || 'Trainer'}</h3>
                                <p className="text-sm text-gray-400">Date: {new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star} 
                                        disabled={ratingLoading}
                                        onClick={() => handleRate(booking.id, star)}
                                        className="text-2xl hover:scale-125 transition-transform text-gray-500 hover:text-yellow-400"
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid-cols-3 mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="card-premium">
                    <h3 className="heading-card text-gray-400 !text-sm !uppercase !tracking-widest">Start Workout</h3>
                    <p className="text-3xl font-bold text-white mt-4 mb-2">Leg Hypertrophy</p>
                    <p className="text-body text-sm mb-6"></p>
                    <Link href="/dashboard/member/workouts" className="btn btn-outline w-full h-12 text-sm flex items-center justify-center">Start Workout</Link>
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
                    <h3 className="heading-card text-gray-400 !text-sm !uppercase !tracking-widest">Trainer Sessions</h3>
                    <p className="text-3xl font-bold text-white mt-4 mb-2">
                        {membershipType === 'BASIC' ? '2 / 5' : membershipType === 'PRO' ? '2 / 10' : 'Unlimited'}
                    </p>
                    <p className="text-body text-sm text-green-400">Sessions Used This Month</p>
                </div>
            </div>

            {/* Premium Features */}
            {(membershipType === 'PRO' || membershipType === 'ELITE') && (
                <div className="animate-fade-in mb-8" style={{ animationDelay: '0.2s' }}>
                    <h2 className="heading-section mb-8">Premium Features</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Priority Support - Pro & Elite */}
                        <div className="card-premium">
                            <h3 className="heading-card text-indigo-400 mb-4">Support</h3>
                            <p className="text-body text-sm mb-4">You have direct access to our priority support team for immediate assistance.</p>
                            <a href="https://wa.me/923276500914" target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full sm:w-auto text-center inline-block">Contact Support</a>
                        </div>

                        {/* Nutrition Plan - Elite Only */}
                        {membershipType === 'ELITE' && (
                            <div className="card-premium border-indigo-500/50">
                                <h3 className="heading-card text-indigo-400 mb-4">Nutrition Plan</h3>
                                <p className="text-body text-sm mb-4">Your personalized daily macro targets and meal recommendations.</p>
                                <Link href="/dashboard/member/nutrition" className="btn btn-primary w-full sm:w-auto text-center inline-block">View Nutrition</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recent Activity / Featured */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
