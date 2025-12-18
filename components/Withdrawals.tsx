import React, { useState } from 'react';
import { Withdrawal, Account } from '../types';
import { ArrowUpCircle, Plus, Trash2, Calendar, Wallet, DollarSign } from 'lucide-react';

interface WithdrawalsProps {
    withdrawals: Withdrawal[];
    onAdd: (w: Withdrawal) => void;
    onDelete: (id: string) => void;
    accounts: Account[];
}

export const Withdrawals: React.FC<WithdrawalsProps> = ({ withdrawals, onAdd, onDelete, accounts }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Withdrawal>>({
        amount: 0,
        method: 'Bank Transfer',
        date: new Date().toISOString().slice(0, 10),
        status: 'COMPLETED'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || formData.amount <= 0) return;
        
        onAdd({
            id: crypto.randomUUID(),
            accountId: formData.accountId || accounts[0]?.id || '1',
            amount: Number(formData.amount),
            date: formData.date || new Date().toISOString(),
            method: formData.method || 'Unknown',
            status: formData.status as 'COMPLETED' | 'PENDING',
            notes: formData.notes
        });
        setIsFormOpen(false);
        setFormData({ amount: 0, method: 'Bank Transfer', date: new Date().toISOString().slice(0, 10), status: 'COMPLETED' });
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Withdrawals</h2>
                    <p className="text-slate-500 dark:text-slate-400">Track your payouts and capital reductions.</p>
                </div>
                <button 
                    onClick={() => setIsFormOpen(true)}
                    className="bg-gold-600 hover:bg-gold-500 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-sm tracking-wider shadow-xl shadow-gold-500/20 transition-all flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Log Payout
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Total Paid Out</p>
                    <h3 className="text-3xl font-black text-rose-500">
                        ${withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}
                    </h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Account</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {withdrawals.map(w => (
                            <tr key={w.id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 text-slate-500 font-medium">{new Date(w.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{accounts.find(a => a.id === w.accountId)?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-slate-500">{w.method}</td>
                                <td className="px-6 py-4 text-rose-500 font-black tracking-tight">-${w.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${w.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {w.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => onDelete(w.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {withdrawals.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No withdrawal history found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-700 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-700">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Log Payout</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Account</label>
                                <select 
                                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-gold-500"
                                    value={formData.accountId}
                                    onChange={e => setFormData({...formData, accountId: e.target.value})}
                                >
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white font-bold"
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Method</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs"
                                        value={formData.method}
                                        onChange={e => setFormData({...formData, method: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-gold-600 hover:bg-gold-500 text-white font-black rounded-2xl uppercase italic text-sm transition-all shadow-lg shadow-gold-500/20">Log Entry</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};