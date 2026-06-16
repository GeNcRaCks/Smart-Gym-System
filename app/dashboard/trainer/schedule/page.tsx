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
            const res = await fetch('/api/bookings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: id, status })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to update booking');
                return;
            }
            fetchBookings();
        } catch (e) {
            console.error(e);
        }
    };

    const isSessionStarted = (booking: any) => {
        try {
            const [time, period] = booking.timeSlot.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

            const bookingDateTime = new Date(booking.date);
            bookingDateTime.setHours(hours, minutes, 0, 0);
            return new Date() >= bookingDateTime;
        } catch {
            return false;
        }
    };

    if (loading) return <div className="text-white p-8">Loading schedule...</div>;

    const pending = bookings.filter(b => b.status === 'PENDING');
    const upcoming = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.date) >= new Date(new Date().toDateString()));
    const past = bookings.filter(b => b.status === 'COMPLETED');
    const cancelled = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED');

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
                    {upcoming.length === 0 ? <p className="text-gray-500">No upcoming sessions scheduled.</p> : upcoming.map(booking => {
                        const started = isSessionStarted(booking);
                        return (
                            <div key={booking.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl">
                                        {new Date(booking.date).getDate()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{booking.member?.user?.name}</div>
                                        <div className="text-sm text-gray-400">{booking.timeSlot} • {booking.type}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                                        disabled={!started}
                                        className={`btn text-xs ${started ? 'btn-outline' : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'}`}
                                        title={!started ? 'Session has not started yet' : 'Mark this session as complete'}
                                    >
                                        {started ? 'Mark Complete' : 'Not Started'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Past Sessions */}
            {past.length > 0 && (
                <div className="card glass-panel p-6">
                    <h2 className="heading-card text-xl mb-6 text-gray-400">Completed Sessions</h2>
                    <div className="space-y-3">
                        {past.map(booking => (
                            <div key={booking.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm font-bold">✓</div>
                                    <div>
                                        <div className="font-semibold text-white">{booking.member?.user?.name}</div>
                                        <div className="text-xs text-gray-400">{new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}</div>
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Completed</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cancelled / Rejected */}
            {cancelled.length > 0 && (
                <div className="card glass-panel p-6">
                    <h2 className="heading-card text-xl mb-6 text-gray-500">Cancelled / Declined</h2>
                    <div className="space-y-3">
                        {cancelled.map(booking => (
                            <div key={booking.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 opacity-60">
                                <div>
                                    <div className="font-semibold text-white">{booking.member?.user?.name}</div>
                                    <div className="text-xs text-gray-400">{new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}</div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'CANCELLED' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {booking.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
