'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function NutritionPlanPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [height, setHeight] = useState(user?.memberProfile?.height?.toString() || '');
    const [weight, setWeight] = useState(user?.memberProfile?.weight?.toString() || '');
    const [results, setResults] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        if (user && user.memberProfile?.membershipType !== 'ELITE') {
            router.push('/dashboard/member');
        }
        fetchHistory();
    }, [user, router]);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/nutrition');
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const calculatePlan = () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);

        if (!h || !w) {
            return alert('Please enter valid height and weight');
        }

        setCalculating(true);

        setTimeout(() => {
            const bmiValue = w / ((h / 100) * (h / 100));
            const bmi = bmiValue.toFixed(1);

            let protein, carbs, fats, mealPlan;

            // Underweight → weight gain
            const targetWeight = 22 * ((h / 100) * (h / 100));
            if (bmiValue < 18.5) {
                protein = (targetWeight * 2).toFixed(0);
                carbs = (targetWeight * 5).toFixed(0);
                fats = (targetWeight * 1.2).toFixed(0);

                mealPlan = {
                    breakfast: `Rich Protein Oats (${(w * 2).toFixed(0)}g oats, ${(w * 0.8).toFixed(0)}g protein powder, peanut butter, berries)`,
                    lunch: `Beef & Rice (${(w * 3).toFixed(0)}g beef, ${(w * 4).toFixed(0)}g cooked rice, avocado)`,
                    snack: `Mixed Nuts & Avocado (${(w * 0.8).toFixed(0)}g nuts, 1 whole avocado)`,
                    dinner: `Salmon & Sweet Potatoes (${(w * 3).toFixed(0)}g salmon, ${(w * 5).toFixed(0)}g sweet potatoes, salad)`
                };

                // Overweight → fat loss
            } else if (bmiValue >= 25) {
                protein = (targetWeight * 2).toFixed(0);
                carbs = (targetWeight * 2).toFixed(0);
                fats = (targetWeight * 0.8).toFixed(0);


                mealPlan = {
                    breakfast: `Egg Whites & Spinach (4 egg whites, ${(w * 0.5).toFixed(0)}g spinach, 1 slice whole wheat toast)`,
                    lunch: `Grilled Chicken Salad (${(w * 2).toFixed(0)}g chicken breast, mixed greens, light dressing)`,
                    snack: `Greek Yogurt & Berries (150g greek yogurt, handful of berries)`,
                    dinner: `White Fish & Broccoli (${(w * 2).toFixed(0)}g white fish, ${(w * 3).toFixed(0)}g steamed broccoli)`
                };

                // Normal → maintenance
            } else {
                protein = (w * 1.8).toFixed(0);
                carbs = (w * 3.5).toFixed(0);
                fats = (w * 1).toFixed(0);

                mealPlan = {
                    breakfast: `Protein Oats (${(w * 1.5).toFixed(0)}g oats, ${(w * 0.5).toFixed(0)}g protein powder, berries)`,
                    lunch: `Chicken & Rice (${(w * 2.5).toFixed(0)}g chicken breast, ${(w * 3).toFixed(0)}g cooked rice, veggies)`,
                    snack: `Almonds & Fruit (${(w * 0.5).toFixed(0)}g mixed nuts, 1 apple)`,
                    dinner: `Lean Fish & Potatoes (${(w * 2.5).toFixed(0)}g white fish, ${(w * 4).toFixed(0)}g potatoes, salad)`
                };
            }

            const hydration = (w * 0.033).toFixed(1);

            setResults({
                bmi,
                protein,
                carbs,
                fats,
                hydration,
                mealPlan,
                weight: w,
                height: h
            });

            setCalculating(false);
        }, 3000);
    };

    const saveLog = async () => {
        if (!results) return;

        setLoading(true);

        try {
            const res = await fetch('/api/nutrition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
            });

            const data = await res.json();

            if (data.success) {
                alert('Saved to logs!');
                fetchHistory();
            } else {
                alert(data.error || 'Failed to save');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.memberProfile?.membershipType !== 'ELITE') return null;

    return (
        <div className="max-w-5xl mx-auto pb-24">
            <h1 className="heading-section mb-2 text-indigo-400">Elite Nutrition Portal</h1>
            <p className="text-gray-400 mb-8">
                Calculate your personalized macros and 7-day meal plan based on your current metrics.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Calculator Form */}
                <div className="card-premium h-fit">
                    <h2 className="heading-card mb-4">Calculate Metrics</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="label-text">Height (cm)</label>
                            <input
                                type="number"
                                className="input"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                placeholder="e.g. 180"
                            />
                        </div>

                        <div>
                            <label className="label-text">Weight (kg)</label>
                            <input
                                type="number"
                                className="input"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="e.g. 80"
                            />
                        </div>

                        <button
                            onClick={calculatePlan}
                            className="btn btn-primary w-full mt-4"
                            disabled={calculating}
                        >
                            {calculating ? 'Calculating...' : 'Calculate Macros'}
                        </button>

                        {calculating && (
                            <div className="mt-4 text-center text-sm text-indigo-400 animate-pulse">
                                Generating your nutrition plan...
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Dashboard */}
                <div className="md:col-span-2 space-y-8">
                    {results && (
                        <div className="animate-fade-in space-y-8">
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="card-premium flex flex-col items-center justify-center text-center p-6 border-indigo-500/30">
                                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Your BMI</p>
                                    <p className="text-4xl font-bold text-white">{results.bmi}</p>
                                </div>

                                <div className="card-premium flex flex-col items-center justify-center text-center p-6 border-blue-500/30">
                                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Hydration</p>
                                    <p className="text-4xl font-bold text-white">
                                        {results.hydration}
                                        <span className="text-lg text-gray-500 ml-1">L</span>
                                    </p>
                                </div>

                                <div className="card-premium sm:col-span-1 flex flex-col justify-center items-center p-6 gap-2 border-white/5">
                                    <button
                                        onClick={saveLog}
                                        disabled={loading}
                                        className="btn btn-outline w-full"
                                    >
                                        {loading ? 'Saving...' : 'Save to Logs'}
                                    </button>
                                </div>
                            </div>

                            <div className="card-premium">
                                <h3 className="heading-card mb-6">Daily Target Macros</h3>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-2xl font-bold text-indigo-400">{results.protein}g</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Protein</p>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-2xl font-bold text-green-400">{results.carbs}g</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Carbs</p>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-2xl font-bold text-yellow-400">{results.fats}g</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Fats</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card-premium">
                                <h3 className="heading-card mb-6">Daily Meal Plan</h3>

                                <div className="space-y-4">
                                    {Object.entries(results.mealPlan).map(([meal, value]) => (
                                        <div
                                            key={meal}
                                            className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <div className="w-16 text-xs text-gray-400 uppercase font-bold pt-1">
                                                {meal}
                                            </div>
                                            <div className="flex-1 text-sm text-gray-200">{value as string}</div>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-gray-500 mt-6 text-center">
                                    This structure should be repeated for the 7-day week, varying protein and carb
                                    sources to maintain variety while hitting target macros.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* History Section */}
                    {history.length > 0 && (
                        <div className="card-premium mt-12">
                            <h3 className="heading-card mb-6">Log History</h3>

                            <div className="space-y-3">
                                {history.map((log: any) => {
                                    const data = JSON.parse(log.data);

                                    return (
                                        <div
                                            key={log.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-4"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {new Date(log.generatedDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Weight: {data.weight}kg • BMI: {data.bmi}
                                                </p>
                                            </div>

                                            <div className="flex gap-4 text-xs font-medium">
                                                <span className="text-indigo-400">{data.protein}g P</span>
                                                <span className="text-green-400">{data.carbs}g C</span>
                                                <span className="text-yellow-400">{data.fats}g F</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}