'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Register() {
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '', password: '', name: '', phone: '', role: 'MEMBER',
        profileData: { height: '', weight: '', membershipType: 'BASIC', level: 'Beginner' }
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            profileData: { ...formData.profileData, [e.target.name]: e.target.value }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Parse numeric values
        const payload = {
            ...formData,
            profileData: {
                ...formData.profileData,
                height: parseFloat(formData.profileData.height) || 0,
                weight: parseFloat(formData.profileData.weight) || 0,
            }
        };

        try {
            await register(payload);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-[var(--header-height)]">
            <div className="w-full max-w-lg glass-panel-auth p-10 animate-fade-in relative overflow-hidden z-10">

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: step === 1 ? '50%' : '100%' }}></div>
                </div>

                <div className="text-center mb-10">
                    <h2 className="heading-lg text-4xl font-bold text-white mb-3">Create Account</h2>
                    <p className="text-gray-400 text-lg">Step {step} of 2: {step === 1 ? 'Personal Details' : 'Your Profile'}</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 text-sm text-center border border-red-500/20 font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="label-text">Full Name</label>
                                <input name="name" type="text" className="input" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label-text">Email Address</label>
                                <input name="email" type="email" className="input" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label-text">Password</label>
                                <input name="password" type="password" className="input" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                            </div>
                            <button type="button" onClick={() => setStep(2)} className="w-full btn btn-primary mt-4 text-lg h-14">Next Step</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="label-text">Height (cm)</label>
                                    <input name="height" type="number" className="input" placeholder="180" value={formData.profileData.height} onChange={handleProfileChange} />
                                </div>
                                <div>
                                    <label className="label-text">Weight (kg)</label>
                                    <input name="weight" type="number" className="input" placeholder="75" value={formData.profileData.weight} onChange={handleProfileChange} />
                                </div>
                            </div>
                            <div>
                                <label className="label-text">Experience Level</label>
                                <select name="level" className="input" value={formData.profileData.level} onChange={handleProfileChange}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Role (Demo)</label>
                                <select name="role" className="input" value={formData.role} onChange={handleChange}>
                                    <option value="MEMBER">Member</option>
                                    <option value="TRAINER">Trainer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 btn btn-outline h-14">Back</button>
                                <button type="submit" className="flex-1 btn btn-primary h-14 shadow-xl shadow-indigo-500/20" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Register'}
                                </button>
                            </div>
                        </div>
                    )}

                </form>

                <p className="mt-8 text-center text-gray-400">
                    Already have an account? <Link href="/login" className="text-white hover:text-indigo-400 hover:underline font-bold transition-colors ml-1">Log in</Link>
                </p>
            </div>
        </div>
    );
}
