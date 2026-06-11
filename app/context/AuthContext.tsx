'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt?: string;
    memberProfile?: {
        weight?: number;
        height?: number;
        level?: string;
        membershipType?: string;
    };
    trainerProfile?: {
        specialty?: string;
        availability?: string;
        rating?: number;
    };
    adminProfile?: {
        accessLevel?: number;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    async function checkUser() {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (e) {
            console.error(e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        checkUser();
    }, []);

    async function login(formData: any) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        await checkUser();

        // Redirect based on role
        if (data.user.role === 'ADMIN') router.push('/dashboard/admin');
        else if (data.user.role === 'TRAINER') router.push('/dashboard/trainer');
        else router.push('/dashboard/member');
    }

    async function register(formData: any) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Auto login ?? or redirect to login. Let's redirect to login for clarity.
        router.push('/login?registered=true');
    }

    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: checkUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
