'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function WorkoutsContent() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const query = searchParams.get('search');

    useEffect(() => {
        setLoading(true);
        const url = query ? `/api/workouts?search=${encodeURIComponent(query)}` : '/api/workouts';

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlans(data);
                else setPlans([]);
            })
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    }, [query]);

    return (
        <div>
            <h1 className="heading-lg mb-8 text-white">Available Workouts</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="card h-48 animate-pulse bg-gray-800"></div>)
                ) : plans.map((plan) => (
                    <div key={plan.id} className="card glass-panel p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-semibold text-white text-lg">{plan.name}</h3>
                            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">{plan.difficulty}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{plan.description}</p>
                        <div className="border-t border-[rgba(255,255,255,0.05)] pt-4 mt-auto">
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                <span>{plan.exercises?.length || 0} exercises</span>
                                <span>{plan.duration} mins</span>
                            </div>
                            <button
                                onClick={() => window.location.href = `/dashboard/member/workouts/active/${plan.id}`}
                                className="w-full btn btn-primary text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow"
                            >
                                Start Workout
                            </button>
                        </div>
                    </div>
                ))}
                {!loading && plans.length === 0 && <p className="text-gray-500">No workout plans available.</p>}
            </div>
        </div>
    );
}

export default function MemberWorkouts() {
    return (
        <Suspense fallback={<div className="text-white p-8">Loading workouts...</div>}>
            <WorkoutsContent />
        </Suspense>
    );
}
