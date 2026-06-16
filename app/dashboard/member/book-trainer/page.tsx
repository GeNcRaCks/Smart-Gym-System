'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookTrainer() {
    const router = useRouter();
    const [trainers, setTrainers] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        trainerId: '',
        date: '',
        timeSlot: '09:00 AM',
        type: 'IN_PERSON'
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trainersRes, bookingsRes] = await Promise.all([
                    fetch('/api/trainers'),
                    fetch('/api/bookings')
                ]);
                const trainersData = await trainersRes.json();
                const bookingsData = await bookingsRes.json();

                if (Array.isArray(trainersData)) {
                    setTrainers(trainersData);
                    if (trainersData.length > 0) {
                        setFormData(prev => ({ ...prev, trainerId: trainersData[0].id }));
                    }
                }
                if (Array.isArray(bookingsData)) setBookings(bookingsData);
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Booking failed');

            setSuccess('Booking confirmed! Waiting for trainer approval.');
            // Refresh bookings list
            try {
                const updatedBookings = await fetch('/api/bookings').then(r => r.json());
                if (Array.isArray(updatedBookings)) setBookings(updatedBookings);
            } catch (ignored) { }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-white p-8">Loading booking system...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="heading-lg text-white">Book a Session</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Booking Form */}
                <div className="card glass-panel p-8">
                    <h2 className="heading-card text-xl mb-6">New Booking</h2>

                    {error && <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 border border-red-500/20">{error}</div>}
                    {success && <div className="bg-green-500/20 text-green-400 p-4 rounded-lg mb-6 border border-green-500/20">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label-text">Select Trainer</label>
                            <select
                                className="input"
                                value={formData.trainerId}
                                onChange={e => setFormData({ ...formData, trainerId: e.target.value })}
                                required
                            >
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.user.name} ({t.specialty}) - {t.rating > 0 ? `${t.rating.toFixed(1)} ⭐` : 'New'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="label-text">Time</label>
                                <select
                                    className="input"
                                    value={formData.timeSlot}
                                    onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                                >
                                    {['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Session Type</label>
                            <select
                                className="input"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="IN_PERSON">In Person</option>
                                <option value="REMOTE">Remote (Video Call)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full btn btn-primary py-4 text-lg mt-4 disabled:opacity-50"
                            disabled={submitting}
                        >
                            {submitting ? 'Booking...' : 'Confirm Appointment'}
                        </button>
                    </form>
                </div>

                {/* Upcoming Bookings */}
                <div className="space-y-6">
                    <h2 className="heading-card text-xl text-white">Your Schedule</h2>
                    {bookings.length === 0 ? (
                        <p className="text-gray-500">No upcoming sessions.</p>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="card glass-panel p-5 border-l-4 border-indigo-500 flex flex-col gap-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-white">{booking.trainer?.user?.name || 'Unknown Trainer'}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                                                booking.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span>📅</span>
                                            {new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>📍</span>
                                            {booking.type === 'IN_PERSON' ? 'Gym Floor' : 'Online Call'}
                                        </div>
                                    </div>
                                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                        <button 
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to cancel this booking?')) {
                                                    try {
                                                        const res = await fetch('/api/bookings', {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ bookingId: booking.id, status: 'CANCELLED' })
                                                        });
                                                        if (res.ok) {
                                                            const updatedBookings = await fetch('/api/bookings').then(r => r.json());
                                                            setBookings(updatedBookings);
                                                        }
                                                    } catch(e) {}
                                                }
                                            }}
                                            className="mt-2 text-xs text-red-400 hover:text-red-300 w-fit"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
