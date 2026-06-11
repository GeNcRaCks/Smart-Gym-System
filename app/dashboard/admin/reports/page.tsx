'use client';

import { useState, useEffect } from 'react';

export default function AdminReports() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setReports(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const generateReport = async (type: string) => {
        setGenerating(true);
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            const newReport = await res.json();
            if (newReport.id) setReports([newReport, ...reports]);
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="heading-lg text-white">System Reports</h1>

            <div className="grid md:grid-cols-3 gap-6">
                <button
                    onClick={() => generateReport('FINANCIAL')}
                    disabled={generating}
                    className="card glass-panel p-6 hover:bg-white/10 transition-colors text-left"
                >
                    <div className="text-3xl mb-2">💰</div>
                    <div className="font-bold text-white mb-1">Generate Financial</div>
                    <div className="text-xs text-gray-400">Revenue & Transactions analysis</div>
                </button>
                <button
                    onClick={() => generateReport('FITNESS')}
                    disabled={generating}
                    className="card glass-panel p-6 hover:bg-white/10 transition-colors text-left"
                >
                    <div className="text-3xl mb-2">🏋️</div>
                    <div className="font-bold text-white mb-1">Generate Fitness</div>
                    <div className="text-xs text-gray-400">Workout activity & user engagement</div>
                </button>
                <button
                    onClick={() => generateReport('SYSTEM')}
                    disabled={generating}
                    className="card glass-panel p-6 hover:bg-white/10 transition-colors text-left"
                >
                    <div className="text-3xl mb-2">⚡</div>
                    <div className="font-bold text-white mb-1">Generate System</div>
                    <div className="text-xs text-gray-400">User growth & platform health</div>
                </button>
            </div>

            <div className="card glass-panel p-8">
                <h2 className="heading-card text-xl mb-6">Report History</h2>
                <div className="space-y-4">
                    {loading ? <p className="text-gray-500">Loading...</p> : reports.length === 0 ? <p className="text-gray-500">No reports generated yet.</p> :
                        reports.map((report) => {
                            const data = report.data ? JSON.parse(report.data) : {};
                            return (
                                <div key={report.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${report.type === 'FINANCIAL' ? 'bg-green-500/20 text-green-400' :
                                                    report.type === 'FITNESS' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-purple-500/20 text-purple-400'
                                                }`}>{report.type} REPORT</span>
                                            <div className="text-gray-400 text-xs mt-2">{new Date(report.generatedDate).toLocaleString()}</div>
                                        </div>
                                        <button className="text-indigo-400 hover:text-indigo-300 text-sm">Download PDF</button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                        {Object.entries(data).map(([key, value]) => (
                                            <div key={key}>
                                                <div className="text-gray-500 text-xs uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                                <div className="text-white font-mono text-lg">{String(value)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
}
