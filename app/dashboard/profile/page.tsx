'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                // Flatten profile data for easier form handling
                weight: user.memberProfile?.weight || '',
                height: user.memberProfile?.height || '',
                level: user.memberProfile?.level || '',
                specialty: user.trainerProfile?.specialty || '',
                availability: user.trainerProfile?.availability || ''
            });
        }
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setMsg('Profile updated successfully! Refresh to see changes.');
                setIsEditing(false);
                window.location.reload();
            } else {
                setMsg('Update failed. Try again.');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="text-white p-8">Loading profile...</div>;
    if (!user) return <div className="text-white p-8">Please log in.</div>;

    const memberData = user.memberProfile;
    const trainerData = user.trainerProfile;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header / Identity with Edit Button */}
            <div className="glass-panel p-8 flex flex-col md:flex-row items-center gap-8 relative">
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute top-8 right-8 btn btn-outline text-xs px-4 py-2"
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>

                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-center md:text-left">
                    <h1 className="heading-hero text-4xl mb-2">{user.name}</h1>
                    <p className="text-gray-400 text-lg mb-4">{user.email}</p>
                    <span className="px-4 py-1.5 rounded-full bg-white/10 text-white font-medium text-sm border border-white/10 inline-block">
                        {user.role} ACCOUNT
                    </span>
                </div>
            </div>

            {msg && <div className="bg-indigo-500/20 text-indigo-300 p-4 rounded-xl text-center border border-indigo-500/20">{msg}</div>}

            {isEditing ? (
                <form onSubmit={handleUpdate} className="glass-panel p-8 space-y-6">
                    <h2 className="heading-card text-xl mb-6">Edit Details</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="label-text">Full Name</label>
                            <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Email</label>
                            <input className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">New Password (leave blank to keep current)</label>
                            <input className="input" type="password" placeholder="******" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>

                        {/* Member Specifics */}
                        {user.role === 'MEMBER' && (
                            <>
                                <div>
                                    <label className="label-text">Weight (kg)</label>
                                    <input className="input" type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-text">Height (cm)</label>
                                    <input className="input" type="number" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-text">Level</label>
                                    <select className="input" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trainer Specifics */}
                        {user.role === 'TRAINER' && (
                            <>
                                <div>
                                    <label className="label-text">Availability</label>
                                    <input className="input" value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label-text">Specialty</label>
                                    <input className="input" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })} />
                                </div>
                            </>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary w-full h-14 text-lg">Save Changes</button>
                </form>
            ) : (
                /* Existing View Mode */
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass-panel p-6">
                        <h2 className="heading-card text-xl mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                            Account Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-gray-400">User ID</span>
                                <span className="text-gray-200 font-mono text-xs">{user.id}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-gray-400">Joined</span>
                                <span className="text-gray-200">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                <span className="text-gray-400">Status</span>
                                <span className="text-green-400 font-medium">Active</span>
                            </div>
                        </div>
                    </div>

                    {memberData && (
                        <div className="glass-panel p-6">
                            <h2 className="heading-card text-xl mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                Fitness Profile
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-gray-400">Membership</span>
                                    <span className="text-yellow-400 font-bold">{memberData.membershipType}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-white">{memberData.weight || '-'} <span className="text-sm text-gray-500 font-normal">kg</span></div>
                                        <div className="text-xs text-gray-400 mt-1">Weight</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-white">{memberData.height || '-'} <span className="text-sm text-gray-500 font-normal">cm</span></div>
                                        <div className="text-xs text-gray-400 mt-1">Height</div>
                                    </div>
                                </div>
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-gray-400">Level</span>
                                    <span className="text-indigo-300">{memberData.level || 'Beginner'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {trainerData && (
                        <div className="glass-panel p-6">
                            <h2 className="heading-card text-xl mb-6 flex items-center gap-2">
                                <span className="w-1 h-6 bg-pink-500 rounded-full"></span>
                                Trainer Info
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-gray-400">Specialty</span>
                                    <span className="text-white">{trainerData.specialty}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-gray-400">Rating</span>
                                    <span className="text-yellow-400">★ {trainerData.rating}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
