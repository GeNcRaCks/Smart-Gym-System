'use client';

import { useState, useEffect } from 'react';

export default function AdminEquipment() {
    const [equipment, setEquipment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ name: '', type: 'Strength', status: 'Operational' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({ name: '', type: 'Strength', status: 'Operational' });
    const [adding, setAdding] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetch('/api/equipment')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setEquipment(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleEditClick = (item: any) => {
        setEditingId(item.id);
        setEditValues({
            name: item.name ?? '',
            type: item.type ?? 'Strength',
            status: item.status ?? 'Operational'
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleUpdate = async (id: string) => {
        setUpdating(true);
        try {
            const res = await fetch('/api/equipment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editValues })
            });
            const updated = await res.json();
            if (updated.id) {
                setEquipment(equipment.map((item) => item.id === id ? updated : item));
                setEditingId(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const res = await fetch('/api/equipment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            const item = await res.json();
            if (item.id) {
                setEquipment([...equipment, item]);
                setNewItem({ name: '', type: 'Strength', status: 'Operational' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this equipment?')) return;
        try {
            await fetch('/api/equipment', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            setEquipment(equipment.filter(e => e.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="heading-lg text-white">Equipment Inventory</h1>

            {/* Add New */}
            <div className="glass-panel p-6">
                <h2 className="heading-card text-lg mb-4">Add New Equipment</h2>
                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="label-text">Equipment Name</label>
                        <input
                            className="input"
                            placeholder="e.g. Treadmill X500"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="label-text">Type</label>
                        <select
                            className="input"
                            value={newItem.type}
                            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                        >
                            <option>Strength</option>
                            <option>Cardio</option>
                            <option>Functional</option>
                            <option>Recovery</option>
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="label-text">Status</label>
                        <select
                            className="input"
                            value={newItem.status}
                            onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                        >
                            <option>Operational</option>
                            <option>Maintenance</option>
                            <option>Out of Order</option>
                        </select>
                    </div>
                    <button type="submit" disabled={adding} className="btn btn-primary h-14 w-full md:w-auto px-8">
                        {adding ? 'Adding...' : 'Add Item'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p className="text-gray-500">Loading inventory...</p> : equipment.map((item) => (
                    <div key={item.id} className="card glass-panel p-6 flex flex-col justify-between group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold ${item.status === 'Operational' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {item.status}
                        </div>
                        <div>
                            {editingId === item.id ? (
                                <div className="space-y-3">
                                    <input
                                        className="input"
                                        value={editValues.name}
                                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                        placeholder="Equipment name"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            className="input"
                                            value={editValues.type}
                                            onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                                        >
                                            <option>Strength</option>
                                            <option>Cardio</option>
                                            <option>Functional</option>
                                            <option>Recovery</option>
                                        </select>
                                        <select
                                            className="input"
                                            value={editValues.status}
                                            onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                                        >
                                            <option>Operational</option>
                                            <option>Maintenance</option>
                                            <option>Out of Order</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-xl mb-1 text-white font-semibold">{item.name}</div>
                                    <div className="text-sm text-gray-500 uppercase tracking-wider mb-4">{item.type} MACHINE</div>
                                    <div className="text-xs text-gray-400">Last Maintenance: {item.lastMaintenance ? new Date(item.lastMaintenance).toLocaleDateString() : 'N/A'}</div>
                                </>
                            )}
                        </div>
                        <div className={`mt-6 pt-4 border-t border-white/5 flex gap-2 transition-opacity ${editingId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            {editingId === item.id ? (
                                <>
                                    <button
                                        onClick={() => handleUpdate(item.id)}
                                        disabled={updating}
                                        className="flex-1 btn btn-primary text-xs h-8"
                                    >
                                        {updating ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex-1 btn btn-outline text-xs h-8"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        className="flex-1 btn btn-outline text-xs h-8"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="flex-1 btn bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border-none text-xs h-8"
                                    >
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
