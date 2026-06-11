'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ActiveWorkout() {
  const { planId } = useParams();
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch plan details
    fetch(`/api/workouts?search=`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        // Find the plan by ID (client-side filter since API is search-based)
        const found = data.find((p: any) => p.id === planId);
        setPlan(found);
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [planId]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFinish = async () => {
    setIsRunning(false);
    // Submit record
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: Math.floor(elapsed / 60), // minutes
          caloriesBurned: Math.floor(elapsed * 8), // rough estimate 8 cal/min
          notes: `Completed ${plan?.name || 'Workout'}`
        })
      });
      router.push('/dashboard/member/progress'); // Redirect to Progress page
    } catch (e) {
      console.error(e);
    }
  };

  if (!plan && elapsed < 2) return <div className="text-white p-8">Loading workout...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pt-12">
      <div className="glass-panel p-12 text-center mb-12 relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
        <div className="relative z-10">
          <span className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-2 block">Time Elapsed</span>
          <h1 className="text-8xl md:text-9xl font-mono text-white tracking-tight drop-shadow-2xl">
            {formatTime(elapsed)}
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel p-8 h-full">
          <h2 className="heading-card text-2xl mb-6 text-white">{plan?.name || 'Loading Name...'}</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {plan?.exercises?.map((ex: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <span className="font-semibold text-gray-200 block text-lg">{ex.name}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Exercise {i + 1}</span>
                </div>
                <span className="text-white font-mono text-xl bg-black/30 px-3 py-1 rounded-lg">
                  {ex.sets} x {ex.reps > 0 ? ex.reps : `${ex.duration}s`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`btn text-xl h-20 w-full transition-all duration-300 transform hover:scale-[1.02] ${isRunning ? 'btn-outline border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10' : 'btn-primary bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20'}`}
          >
            {isRunning ? 'PAUSE TIMER' : 'RESUME SESSION'}
          </button>

          <button
            onClick={handleFinish}
            className="btn btn-primary h-20 w-full bg-red-600 hover:bg-red-700 border-none text-white text-xl font-bold shadow-lg shadow-red-600/20 transition-all duration-300 transform hover:scale-[1.02]"
          >
            FINISH & SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
