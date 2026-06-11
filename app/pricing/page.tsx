'use client';

import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function PricingPage() {
    const { user } = useAuth();
    const [plan, setPlan] = useState('PRO');
    const [method, setMethod] = useState('CREDIT_CARD');
    const [txId, setTxId] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const jazzCashAccount = process.env.NEXT_PUBLIC_JAZZCASH_ACCOUNT || '0300-XXXXXXX';
    const [loading, setLoading] = useState(false);

    const plans = [
        { id: 'BASIC', name: 'Basic', price: 29, features: ['Access to gym equipment', '1 group class/week', 'Basic support'] },
        { id: 'PRO', name: 'Pro', price: 59, features: ['Everything in Basic', '3 group classes/week', 'Personalized workout plan', 'Priority support'] },
        { id: 'ELITE', name: 'Elite', price: 99, features: ['Everything in Pro', 'Unlimited classes', '1:1 trainer sessions (4/mo)', 'Nutrition plan'] }
    ];

    async function handlePay() {
        if (!user) return window.location.href = '/login';
        setLoading(true);
        try {
            const selected = plans.find(p => p.id === plan)!;
            let proofBase64 = null;
            if (proofFile) proofBase64 = await fileToBase64(proofFile);

            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: selected.price, method, details: { txId }, proofBase64 })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Payment failed');
            if (data.status === 'PENDING') alert('Payment submitted and awaiting verification by admin.');
            else alert('Payment successful!');
            // Optionally redirect or refresh
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container py-24">
            <h1 className="heading-section text-center mb-8">Pricing</h1>
            <div className="max-w-3xl mx-auto space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map(p => (
                            <div key={p.id} className={`card-premium p-6 flex flex-col justify-between ${plan === p.id ? 'border-indigo-500/50 shadow-lg' : ''}`}>
                                <div>
                                    <h2 className="heading-card">{p.name}</h2>
                                    <p className="text-3xl font-bold text-white mb-2">PKR {p.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                    <p className="text-body text-sm mb-4">{p.name} membership.</p>

                                    <ul className="mb-4 space-y-2">
                                        {p.features.map((f: string) => (
                                            <li key={f} className="text-sm text-gray-300">• {f}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <button onClick={() => setPlan(p.id)} className={`w-full ${plan === p.id ? 'btn-primary' : 'btn-outline'}`}>{plan === p.id ? 'Selected' : 'Choose'}</button>
                                </div>
                            </div>
                        ))}
                    </div>

                <div className="card glass-panel p-6">
                    <h3 className="heading-card mb-4">Payment</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label-text">Payment Method</label>
                            <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
                                <option value="CREDIT_CARD">Credit Card</option>
                                <option value="PAYPAL">PayPal</option>
                                <option value="JAZZCASH">JazzCash / Mobile Transfer</option>
                                <option value="BANK_TRANSFER">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Amount</label>
                            <input className="input" value={plans.find(p => p.id === plan)?.price ?? ''} disabled />
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {method === 'JAZZCASH' || method === 'BANK_TRANSFER' ? (
                            <div className="space-y-2">
                                <div>
                                    <label className="label-text">Transaction ID / Reference</label>
                                    <input className="input" value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. TXN12345" />
                                </div>
                                <div>
                                    <label className="label-text">Upload Proof (optional)</label>
                                    <input type="file" accept="image/*" onChange={e => setProofFile(e.target.files ? e.target.files[0] : null)} />
                                </div>
                                <div className="text-sm text-gray-400">Payments to be made to the gym's JazzCash account. After submitting, admins will verify and confirm your payment.</div>
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-3">
                            {(method === 'JAZZCASH' || method === 'BANK_TRANSFER') && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300 space-y-2">
                                    <p className="text-white font-semibold">Transfer Instructions</p>
                                    <p>Send the exact amount to the gym account below and save your transfer reference.</p>
                                    <p><span className="font-semibold">JazzCash Account:</span> {jazzCashAccount}</p>
                                    <p><span className="font-semibold">Amount:</span> PKR {plans.find(p => p.id === plan)?.price}</p>
                                    <p>After transferring, enter the transaction reference and upload an image receipt.</p>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handlePay} disabled={loading} className="btn btn-primary flex-1">{loading ? 'Processing...' : 'Pay Now'}</button>
                                {!user && <a href="/login" className="btn btn-outline">Log in to pay</a>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function fileToBase64(file: File | null) {
    if (!file) return null;
    return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}
