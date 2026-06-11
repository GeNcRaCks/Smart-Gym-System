'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Login() {
    const { login, loading } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await login(formData);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-[var(--header-height)]">
            <div className="w-full max-w-md glass-panel-auth p-10 animate-fade-in relative z-10">
                <div className="text-center mb-10">
                    <h2 className="heading-lg text-4xl font-bold text-white mb-3">Welcome Back</h2>
                    <p className="text-gray-400 text-lg">Sign in to continue your journey</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 text-sm text-center border border-red-500/20 font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="label-text">Email Address</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="label-text">Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full btn btn-primary mt-4 text-lg h-14 shadow-xl shadow-indigo-500/20"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-gray-400">
                    Don't have an account? <Link href="/register" className="text-white hover:text-indigo-400 hover:underline font-bold transition-colors ml-1">Join Free</Link>
                </p>
            </div>
        </div>
    );
}
