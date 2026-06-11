'use client';

import { useEffect, useState } from 'react';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    async function fetchPayments() {
        setLoading(true);
        const res = await fetch('/api/payments');
        const data = await res.json();
        if (Array.isArray(data)) setPayments(data);
        setLoading(false);
    }

    async function updateStatus(id: string, status: string) {
        setActionLoading(id);
        const res = await fetch('/api/payments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const data = await res.json();
        if (res.ok) {
            setPayments(payments.map((payment) => payment.id === id ? data : payment));
        } else {
            alert(data.error || 'Could not update payment');
        }
        setActionLoading(null);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="heading-lg text-white">Payments</h1>
                    <p className="text-sm text-gray-400">Approve or reject pending membership payments.</p>
                </div>
            </div>

            <div className="card glass-panel overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-800/50 text-xs uppercase font-medium text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Proof</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center">Loading payments...</td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center">No payments found.</td></tr>
                        ) : payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{payment.member?.user?.name || 'Member'}</td>
                                <td className="px-6 py-4">PKR {payment.amount}</td>
                                <td className="px-6 py-4">{payment.method}</td>
                                <td className="px-6 py-4">{payment.reference || '-'}</td>
                                <td className="px-6 py-4">
                                    {payment.proofUrl ? (
                                        <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-100">View</a>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-300' : payment.status === 'COMPLETED' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {payment.status === 'PENDING' ? (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(payment.id, 'COMPLETED')}
                                                    disabled={actionLoading === payment.id}
                                                    className="text-green-300 hover:text-green-100 text-sm font-medium"
                                                >
                                                    {actionLoading === payment.id ? 'Saving...' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(payment.id, 'REJECTED')}
                                                    disabled={actionLoading === payment.id}
                                                    className="text-red-300 hover:text-red-100 text-sm font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-gray-500 text-sm">No action</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
