'use client';

import { useEffect, useState } from 'react';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <h1 className="heading-lg mb-8 text-white">User Management</h1>

            <div className="card glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-gray-800/50 text-xs uppercase font-medium text-gray-300">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center">Loading users...</td></tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                                            user.role === 'TRAINER' ? 'bg-pink-500/10 text-pink-400' :
                                                'bg-indigo-500/10 text-indigo-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
                                        Active
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-4">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/reports/download?userId=${user.id}&format=pdf`);
                                                        if (!res.ok) throw new Error('Report failed');
                                                        const blob = await res.blob();
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `report-${user.id}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                        URL.revokeObjectURL(url);
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('Could not download report');
                                                    }
                                                }}
                                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                                            >
                                                Download (PDF)
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this user?')) {
                                                        fetch('/api/users', {
                                                            method: 'DELETE',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ id: user.id })
                                                        }).then(async (r) => {
                                                            const json = await r.json();
                                                            if (!r.ok) return alert(json.error || 'Delete failed');
                                                            setUsers(users.filter(u => u.id !== user.id));
                                                        });
                                                    }
                                                }}
                                                className="text-red-400 hover:text-red-300 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
