'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { validators, errorMessages } from '@/lib/validation';

export default function Register() {
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '', password: '', name: '', phone: '', role: 'MEMBER',
        profileData: { height: '', weight: '', membershipType: 'BASIC', level: 'Beginner' }
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear field error on change
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            profileData: { ...formData.profileData, [e.target.name]: e.target.value }
        });
        if (fieldErrors[e.target.name]) {
            setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};

        if (!validators.name(formData.name)) {
            errors.name = errorMessages.name;
        }
        if (!validators.email(formData.email)) {
            errors.email = errorMessages.email;
        }
        if (!validators.password(formData.password)) {
            errors.password = errorMessages.password;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errors: Record<string, string> = {};

        if (formData.profileData.height && !validators.height(formData.profileData.height)) {
            errors.height = errorMessages.height;
        }
        if (formData.profileData.weight && !validators.weight(formData.profileData.weight)) {
            errors.weight = errorMessages.weight;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNextStep = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

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

    const handleGoogleSignUp = async (response: any) => {
        setGoogleLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Google sign-up failed');

            // Redirect based on role
            if (data.user.role === 'ADMIN') window.location.href = '/dashboard/admin';
            else if (data.user.role === 'TRAINER') window.location.href = '/dashboard/trainer';
            else window.location.href = '/dashboard/member';
        } catch (err: any) {
            setError(err.message || 'Google sign-up failed');
        } finally {
            setGoogleLoading(false);
        }
    };

    // Initialize Google Sign-In
    const initializeGoogle = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId || !(window as any).google) return;

        (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleSignUp,
        });
        (window as any).google.accounts.id.renderButton(
            document.getElementById('google-signup-btn'),
            {
                theme: 'filled_black',
                size: 'large',
                width: '100%',
                text: 'signup_with',
                shape: 'pill',
            }
        );
    };

    // Try to init Google on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            if ((window as any).google) {
                setTimeout(initializeGoogle, 100);
            } else {
                // Wait for the script to load
                const interval = setInterval(() => {
                    if ((window as any).google) {
                        clearInterval(interval);
                        initializeGoogle();
                    }
                }, 200);
                setTimeout(() => clearInterval(interval), 5000);
            }
        }
    });

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
                                <input name="name" type="text" className={`input ${fieldErrors.name ? 'border-red-500/50' : ''}`} placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                                {fieldErrors.name && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.name}</p>}
                            </div>
                            <div>
                                <label className="label-text">Email Address</label>
                                <input name="email" type="email" className={`input ${fieldErrors.email ? 'border-red-500/50' : ''}`} placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                                {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.email}</p>}
                            </div>
                            <div>
                                <label className="label-text">Password</label>
                                <input name="password" type="password" className={`input ${fieldErrors.password ? 'border-red-500/50' : ''}`} placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                                {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.password}</p>}
                                {!fieldErrors.password && formData.password.length > 0 && formData.password.length < 8 && (
                                    <p className="text-yellow-500/70 text-xs mt-1.5 ml-1">{formData.password.length}/8 characters minimum</p>
                                )}
                            </div>

                            <button type="button" onClick={handleNextStep} className="w-full btn btn-primary mt-4 text-lg h-14">Next Step</button>

                            {/* Divider */}
                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                <div className="relative flex justify-center text-sm"><span className="px-4 bg-[var(--color-surface)] text-gray-500">or</span></div>
                            </div>

                            {/* Google Sign-Up */}
                            <div className="flex justify-center">
                                <div id="google-signup-btn" className="w-full"></div>
                            </div>
                            {googleLoading && <p className="text-center text-gray-400 text-sm">Signing up with Google...</p>}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="label-text">Height (cm)</label>
                                    <input name="height" type="number" className={`input ${fieldErrors.height ? 'border-red-500/50' : ''}`} placeholder="180" value={formData.profileData.height} onChange={handleProfileChange} />
                                    {fieldErrors.height && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.height}</p>}
                                </div>
                                <div>
                                    <label className="label-text">Weight (kg)</label>
                                    <input name="weight" type="number" className={`input ${fieldErrors.weight ? 'border-red-500/50' : ''}`} placeholder="75" value={formData.profileData.weight} onChange={handleProfileChange} />
                                    {fieldErrors.weight && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.weight}</p>}
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
