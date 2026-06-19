// Shared validation utilities for client-side and server-side use

export const validators = {
    email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    password: (v: string) => v.length >= 8,
    name: (v: string) => v.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(v.trim()),
    positiveInteger: (v: number | string) => {
        const n = typeof v === 'string' ? parseInt(v) : v;
        return !isNaN(n) && Number.isInteger(n) && n > 0;
    },
    nonNegativeInteger: (v: number | string) => {
        const n = typeof v === 'string' ? parseInt(v) : v;
        return !isNaN(n) && Number.isInteger(n) && n >= 0;
    },
    height: (v: number | string) => {
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return !isNaN(n) && n >= 50 && n <= 300;
    },
    weight: (v: number | string) => {
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return !isNaN(n) && n >= 10 && n <= 500;
    },
    duration: (v: number | string) => {
        const n = typeof v === 'string' ? parseInt(v) : v;
        return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 600;
    },
    sets: (v: number | string) => {
        const n = typeof v === 'string' ? parseInt(v) : v;
        return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 100;
    },
    reps: (v: number | string) => {
        const n = typeof v === 'string' ? parseInt(v) : v;
        return !isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 1000;
    },
    exerciseDuration: (v: number | string) => {
        const n = typeof v === 'string' ? parseInt(v) : v;
        return !isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 86400;
    },
    minLength: (v: string, min: number) => v.trim().length >= min,
};

export const errorMessages = {
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters long',
    name: 'Name must be at least 2 characters (letters and spaces only)',
    height: 'Height must be between 50 and 300 cm',
    weight: 'Weight must be between 10 and 500 kg',
    planName: 'Plan name must be at least 2 characters',
    description: 'Description must be at least 10 characters',
    duration: 'Duration must be between 1 and 600 minutes',
    exerciseName: 'Exercise name is required',
    sets: 'Sets must be between 1 and 100',
    reps: 'Reps must be between 0 and 1000',
    exerciseDuration: 'Duration must be between 0 and 86400 seconds',
};
