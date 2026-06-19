'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { validators, errorMessages } from '@/lib/validation';

export default function ManageWorkouts() {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Form State
    const [plan, setPlan] = useState({
        name: '',
        description: '',
        difficulty: 'Beginner',
        duration: '',
        exercises: [{ name: '', sets: '', reps: '', duration: '' }]
    });

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const fetchWorkouts = async () => {
        try {
            const res = await fetch('/api/workouts');
            const data = await res.json();
            if (Array.isArray(data)) setWorkouts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExercise = () => {
        setPlan({
            ...plan,
            exercises: [...plan.exercises, { name: '', sets: '', reps: '', duration: '' }]
        });
    };

    const handleRemoveExercise = (index: number) => {
        if (plan.exercises.length <= 1) return;
        const newExercises = plan.exercises.filter((_, i) => i !== index);
        setPlan({ ...plan, exercises: newExercises });
        // Clear exercise-specific errors
        const newErrors = { ...fieldErrors };
        Object.keys(newErrors).forEach(key => {
            if (key.startsWith(`exercise_${index}_`)) delete newErrors[key];
        });
        setFieldErrors(newErrors);
    };

    const handleExerciseChange = (index: number, field: string, value: string) => {
        const newExercises: any = [...plan.exercises];
        newExercises[index][field] = value;
        setPlan({ ...plan, exercises: newExercises });
        // Clear field error on change
        const errorKey = `exercise_${index}_${field}`;
        if (fieldErrors[errorKey]) {
            setFieldErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
    };

    const handlePlanChange = (field: string, value: string) => {
        setPlan({ ...plan, [field]: value });
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validate plan fields
        if (!validators.minLength(plan.name, 2)) {
            errors.name = errorMessages.planName;
        }
        if (!validators.minLength(plan.description, 10)) {
            errors.description = errorMessages.description;
        }
        if (!plan.duration || !validators.duration(plan.duration)) {
            errors.duration = errorMessages.duration;
        }

        // Validate exercises
        plan.exercises.forEach((ex, i) => {
            if (!ex.name.trim()) {
                errors[`exercise_${i}_name`] = errorMessages.exerciseName;
            }
            if (!ex.sets || !validators.sets(ex.sets)) {
                errors[`exercise_${i}_sets`] = errorMessages.sets;
            }
            if (ex.reps && !validators.reps(ex.reps)) {
                errors[`exercise_${i}_reps`] = errorMessages.reps;
            }
            if (ex.duration && !validators.exerciseDuration(ex.duration)) {
                errors[`exercise_${i}_duration`] = errorMessages.exerciseDuration;
            }
        });

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEdit = (workout: any) => {
        setEditingId(workout.id);
        setFieldErrors({});
        setPlan({
            name: workout.name,
            description: workout.description,
            difficulty: workout.difficulty,
            duration: workout.duration,
            exercises: workout.exercises.map((e: any) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps || '',
                duration: e.duration || ''
            }))
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workout plan?')) return;
        try {
            await fetch('/api/workouts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            setWorkouts(workouts.filter(w => w.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            // Scroll to first error
            const firstErrorEl = document.querySelector('.text-red-400');
            if (firstErrorEl) firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const payload = {
            ...plan,
            duration: parseInt(plan.duration),
            exercises: plan.exercises.map((ex: any) => ({
                name: ex.name,
                sets: parseInt(ex.sets),
                reps: ex.reps ? parseInt(ex.reps) : 0,
                duration: ex.duration ? parseInt(ex.duration) : 0
            }))
        };

        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? JSON.stringify({ ...payload, id: editingId }) : JSON.stringify(payload);

            const res = await fetch('/api/workouts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });

            const result = await res.json();
            if (!res.ok) {
                alert(result?.error || 'Unable to save workout');
                return;
            }

            alert(editingId ? 'Workout Updated!' : 'Workout Created!');
            setPlan({
                name: '',
                description: '',
                difficulty: 'Beginner',
                duration: '',
                exercises: [{ name: '', sets: '', reps: '', duration: '' }]
            });
            setEditingId(null);
            setFieldErrors({});
            fetchWorkouts();
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred while saving the workout.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="heading-lg text-white">{editingId ? 'Edit Workout Plan' : 'Create Workout Plan'}</h1>
                {editingId && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFieldErrors({});
                            setPlan({
                                name: '',
                                description: '',
                                difficulty: 'Beginner',
                                duration: '',
                                exercises: [{ name: '', sets: '', reps: '', duration: '' }]
                            });
                        }}
                        className="btn btn-outline text-sm"
                    >
                        Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className={`card glass-panel p-8 space-y-6 ${editingId ? 'border-l-4 border-l-yellow-500' : ''}`}>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="label-text">Plan Name</label>
                        <input
                            className={`input ${fieldErrors.name ? 'border-red-500/50' : ''}`}
                            placeholder="e.g. 30-Day Shred"
                            value={plan.name}
                            onChange={e => handlePlanChange('name', e.target.value)}
                            required
                        />
                        {fieldErrors.name && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.name}</p>}
                    </div>
                    <div>
                        <label className="label-text">Difficulty</label>
                        <select
                            className="input"
                            value={plan.difficulty}
                            onChange={e => handlePlanChange('difficulty', e.target.value)}
                        >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label-text">Description</label>
                    <textarea
                        className={`input min-h-[100px] ${fieldErrors.description ? 'border-red-500/50' : ''}`}
                        placeholder="Briefly describe the goal of this workout (at least 10 characters)..."
                        value={plan.description}
                        onChange={e => handlePlanChange('description', e.target.value)}
                        required
                    />
                    {fieldErrors.description && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.description}</p>}
                </div>

                <div>
                    <label className="label-text">Total Duration (mins)</label>
                    <input
                        type="number"
                        min="1"
                        max="600"
                        className={`input ${fieldErrors.duration ? 'border-red-500/50' : ''}`}
                        placeholder="45"
                        value={plan.duration}
                        onChange={e => handlePlanChange('duration', e.target.value)}
                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                        required
                    />
                    {fieldErrors.duration && <p className="text-red-400 text-xs mt-1.5 ml-1">{fieldErrors.duration}</p>}
                </div>

                <div className="border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="heading-card text-lg">Exercises</h3>
                        <button type="button" onClick={handleAddExercise} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
                            + Add Exercise
                        </button>
                    </div>

                    <div className="space-y-4">
                        {plan.exercises.map((ex, i) => (
                            <div key={i} className="grid grid-cols-12 gap-3 items-start p-4 bg-white/5 rounded-xl border border-white/5 relative">
                                <div className="col-span-12 md:col-span-4">
                                    <label className="text-xs text-gray-500 mb-1 block">Exercise Name</label>
                                    <input
                                        className={`input h-10 text-sm ${fieldErrors[`exercise_${i}_name`] ? 'border-red-500/50' : ''}`}
                                        placeholder="e.g. Bench Press"
                                        value={ex.name}
                                        onChange={e => handleExerciseChange(i, 'name', e.target.value)}
                                        required
                                    />
                                    {fieldErrors[`exercise_${i}_name`] && <p className="text-red-400 text-xs mt-1">{fieldErrors[`exercise_${i}_name`]}</p>}
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Sets</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className={`input h-10 text-sm ${fieldErrors[`exercise_${i}_sets`] ? 'border-red-500/50' : ''}`}
                                        placeholder="3"
                                        value={ex.sets}
                                        onChange={e => handleExerciseChange(i, 'sets', e.target.value)}
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                        required
                                    />
                                    {fieldErrors[`exercise_${i}_sets`] && <p className="text-red-400 text-xs mt-1">{fieldErrors[`exercise_${i}_sets`]}</p>}
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        className={`input h-10 text-sm ${fieldErrors[`exercise_${i}_reps`] ? 'border-red-500/50' : ''}`}
                                        placeholder="12"
                                        value={ex.reps}
                                        onChange={e => handleExerciseChange(i, 'reps', e.target.value)}
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                    />
                                    {fieldErrors[`exercise_${i}_reps`] && <p className="text-red-400 text-xs mt-1">{fieldErrors[`exercise_${i}_reps`]}</p>}
                                </div>
                                <div className="col-span-3 md:col-span-3">
                                    <label className="text-xs text-gray-500 mb-1 block">Time (s)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="86400"
                                        className={`input h-10 text-sm ${fieldErrors[`exercise_${i}_duration`] ? 'border-red-500/50' : ''}`}
                                        placeholder="60"
                                        value={ex.duration}
                                        onChange={e => handleExerciseChange(i, 'duration', e.target.value)}
                                        onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                                    />
                                    {fieldErrors[`exercise_${i}_duration`] && <p className="text-red-400 text-xs mt-1">{fieldErrors[`exercise_${i}_duration`]}</p>}
                                </div>
                                {plan.exercises.length > 1 && (
                                    <div className="col-span-1 flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExercise(i)}
                                            className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Remove exercise"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4">
                    <button type="submit" className="w-full btn btn-primary py-4 text-lg shadow-xl shadow-indigo-500/20">
                        {editingId ? 'Update Workout Plan' : 'Create Workout Plan'}
                    </button>
                </div>
            </form>

            {/* List of Existing Plans */}
            <div className="space-y-6">
                <h2 className="heading-card text-2xl text-white">Existing Plans</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? <p className="text-gray-500">Loading workouts...</p> : workouts.map((workout) => (
                        <div key={workout.id} className="card glass-panel p-6 flex flex-col justify-between group relative">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold text-white text-lg">{workout.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${workout.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                                            workout.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>{workout.difficulty}</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{workout.description}</p>
                                <div className="text-sm text-gray-500 mb-4">
                                    {workout.exercises?.length || 0} exercises • {workout.duration} mins
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex gap-2">
                                <button
                                    onClick={() => handleEdit(workout)}
                                    className="flex-1 btn btn-outline text-xs h-8 hover:bg-white/10"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(workout.id)}
                                    className="flex-1 btn bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-none text-xs h-8"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                    {!loading && workouts.length === 0 && <p className="text-gray-500">No workout plans found.</p>}
                </div>
            </div>
        </div>
    );
}
