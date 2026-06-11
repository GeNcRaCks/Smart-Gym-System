'use client';

import { useEffect, useState } from 'react';

export default function ProgressPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalWorkouts: 0, totalMinutes: 0, totalCalories: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/records')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setHistory(data);
                    // Calculate stats
                    const totalWorkouts = data.length;
                    const totalMinutes = data.reduce((acc, curr) => acc + (curr.duration || 0), 0);
                    const totalCalories = data.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);
                    setStats({ totalWorkouts, totalMinutes, totalCalories });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-white p-8">Loading progress...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <h1 className="heading-lg text-white">Your Progress</h1>

            <div className="flex justify-end">
                <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/reports/download?format=pdf');
                            if (!res.ok) throw new Error('Failed to generate report');
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `workout-report.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                        } catch (e) {
                            console.error(e);
                            alert('Could not download report.');
                        }
                    }}
                    className="btn btn-outline"
                >
                    Download Report (PDF)
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl">💪</div>
                    <div>
                        <div className="text-3xl font-bold text-white">{stats.totalWorkouts}</div>
                        <div className="text-sm text-gray-400">Workouts Completed</div>
                    </div>
                </div>
                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl">⏱️</div>
                    <div>
                        <div className="text-3xl font-bold text-white">{stats.totalMinutes}</div>
                        <div className="text-sm text-gray-400">Minutes Active</div>
                    </div>
                </div>
                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-2xl">🔥</div>
                    <div>
                        <div className="text-3xl font-bold text-white">{stats.totalCalories}</div>
                        <div className="text-sm text-gray-400">Calories Burned</div>
                    </div>
                </div>
            </div>

            {/* History List */}
            <div className="glass-panel p-8">
                <h2 className="heading-card text-xl mb-6">Recent Activity</h2>
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <p className="text-gray-500 py-4">No workouts recorded yet. Start training!</p>
                    ) : (
                        history.map((record) => (
                            <div key={record.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4 mb-2 md:mb-0 w-full md:w-auto">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center font-bold">✓</div>
                                    <div>
                                        <div className="font-semibold text-white">{record.notes || 'Workout Session'}</div>
                                        <div className="text-xs text-gray-400">{new Date(record.date).toLocaleDateString()} • {new Date(record.date).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-sm">
                                    <div className="text-center">
                                        <div className="font-bold text-white">{record.duration}</div>
                                        <div className="text-gray-500 text-xs">Mins</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-white">{record.caloriesBurned}</div>
                                        <div className="text-gray-500 text-xs">Cals</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
