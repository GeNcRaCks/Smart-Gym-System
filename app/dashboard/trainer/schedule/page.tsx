'use client';

import { useState, useEffect } from 'react';

export default function TrainerSchedule() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = () => {
        fetch('/api/bookings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setBookings(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await fetch('/api/bookings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: id, status })
            });
            fetchBookings();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="text-white p-8">Loading schedule...</div>;

    const pending = bookings.filter(b => b.status === 'PENDING');
    const upcoming = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.date) >= new Date());
    const past = bookings.filter(b => b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && new Date(b.date) < new Date()));

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="heading-lg text-white">My Schedule</h1>

            {/* Pending Requests */}
            {pending.length > 0 && (
                <div className="card glass-panel p-6 border-l-4 border-yellow-500">
                    <h2 className="heading-card text-xl mb-4 text-yellow-400">Pending Requests ({pending.length})</h2>
                    <div className="space-y-4">
                        {pending.map(booking => (
                            <div key={booking.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white/5 rounded-xl">
                                <div>
                                    <div className="font-bold text-white text-lg">{booking.member?.user?.name || 'Client'}</div>
                                    <div className="text-sm text-gray-400">
                                        {new Date(booking.date).toLocaleDateString()} at {booking.timeSlot} • {booking.type}
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4 md:mt-0">
                                    <button
                                        onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                                        className="btn bg-green-500 hover:bg-green-600 border-none text-white text-sm px-6"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(booking.id, 'REJECTED')}
                                        className="btn bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border-none text-sm px-6"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Sessions */}
            <div className="card glass-panel p-6">
                <h2 className="heading-card text-xl mb-6">Upcoming Sessions</h2>
                <div className="space-y-4">
                    {upcoming.length === 0 ? <p className="text-gray-500">No upcoming sessions scheduled.</p> : upcoming.map(booking => (
                        <div key={booking.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                                    {new Date(booking.date).getDate()}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{booking.member?.user?.name}</div>
                                    <div className="text-sm text-gray-400">{booking.timeSlot} • {booking.type}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                                className="btn btn-outline text-xs"
                            >
                                Mark Complete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
