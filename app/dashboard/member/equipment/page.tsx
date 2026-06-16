'use client';

import { useState, useEffect } from 'react';

export default function MemberEquipmentPage() {
    const [equipment, setEquipment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const res = await fetch('/api/equipment');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setEquipment(data);
                }
            } catch (e) {
                console.error('Failed to fetch equipment:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchEquipment();
    }, []);

    return (
        <div className="max-w-6xl mx-auto pb-24">
            <h1 className="heading-section mb-2">Gym Equipment Status</h1>
            <p className="text-gray-400 mb-8">View the current operational status of all equipment in the gym.</p>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading equipment...</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {equipment.map((item) => (
                        <div key={item.id} className="card-premium p-6 flex flex-col h-full border border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-white">{item.name}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    item.status === 'Operational' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    item.status === 'Maintenance' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                    {item.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 uppercase tracking-wider mb-auto">{item.type}</p>
                            {item.lastMaintenance && (
                                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-white/10">
                                    Last Maintenance: {new Date(item.lastMaintenance).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ))}
                    {equipment.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-white/5">
                            No equipment records found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
