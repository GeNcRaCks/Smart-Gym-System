'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useEffect, useState } from 'react';

interface Rating {
    id: string;
    rating: number;
    feedback: string | null;
    memberName: string;
    createdAt: string;
}

interface Statistics {
    totalRatings: number;
    averageRating: number | string;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export function TrainerRatingsHistory() {
    const { user } = useAuth();
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [stats, setStats] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                if (!user?.trainerProfile?.id) {
                    setLoading(false);
                    return;
                }
                
                const response = await fetch(`/api/trainers/${user.trainerProfile.id}/ratings`);
                if (!response.ok) throw new Error('Failed to fetch ratings');
                
                const data = await response.json();
                setRatings(data.ratings);
                setStats(data.statistics);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRatings();
    }, [user?.trainerProfile?.id]);

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-400';
        if (rating >= 3) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRatingStars = (rating: number) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    if (loading) {
        return (
            <div className="card glass-panel p-6">
                <h3 className="font-bold text-white text-lg mb-4">Rating History</h3>
                <div className="text-center py-8">
                    <p className="text-gray-400">Loading ratings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card glass-panel p-6">
                <h3 className="font-bold text-white text-lg mb-4">Rating History</h3>
                <div className="text-center py-8">
                    <p className="text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card glass-panel p-6">
            <h3 className="font-bold text-white text-lg mb-6">Rating History & Feedback</h3>
            
            {stats && (
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-gray-700">
                    <div>
                        <p className="text-gray-400 text-sm">Total Ratings</p>
                        <p className="text-2xl font-bold text-white">{stats.totalRatings}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Average Rating</p>
                        <p className="text-2xl font-bold text-yellow-400">{stats.averageRating}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">5 Stars</p>
                        <p className="text-lg font-bold text-green-400">{stats.ratingDistribution[5]}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">1 Stars</p>
                        <p className="text-lg font-bold text-red-400">{stats.ratingDistribution[1]}</p>
                    </div>
                </div>
            )}

            {ratings.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-400">No ratings yet. Great feedback is on the way!</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {ratings.map((rating) => (
                        <div key={rating.id} className="bg-gray-800/50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-white">{rating.memberName}</p>
                                    <p className={`text-sm font-bold ${getRatingColor(rating.rating)}`}>
                                        {getRatingStars(rating.rating)}
                                    </p>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {new Date(rating.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {rating.feedback && (
                                <p className="text-sm text-gray-300 italic">"{rating.feedback}"</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
