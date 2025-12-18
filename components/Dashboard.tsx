import React, { useMemo } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface DashboardProps {
    trades: Trade[];
    accountBalance: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ trades, accountBalance }) => {
    const stats = useMemo(() => {
        const closedTrades = trades.filter(t => t.status === 'CLOSED');
        const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
        const wins = closedTrades.filter(t => t.pnl > 0).length;
        const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
        const profitFactor = Math.abs(closedTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0) / (closedTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0) || 1));

        return { totalPnl, winRate, profitFactor, tradeCount: closedTrades.length };
    }, [trades]);

    const dailyChartData = useMemo(() => {
        const dailyMap = new Map<string, number>();
        trades.filter(t => t.status === 'CLOSED').forEach(t => {
            const date = new Date(t.entryDate).toLocaleDateString();
            dailyMap.set(date, (dailyMap.get(date) || 0) + t.pnl);
        });

        return Array.from(dailyMap.entries()).map(([date, pnl]) => ({ date, pnl }));
    }, [trades]);

    return (
        <div className="space-y-6">
            <header className="mb-6">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Terminal Dashboard</h2>
                <p className="text-slate-500">Global account intelligence.</p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Net P&L" value={`$${stats.totalPnl.toFixed(2)}`} positive={stats.totalPnl >= 0} icon={DollarSign} />
                <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} icon={Activity} color="gold" />
                <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} icon={TrendingUp} color="gold" />
                <StatCard label="Live Equity" value={`$${accountBalance.toLocaleString()}`} icon={TrendingUp} color="gold" />
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8">Daily Yield Breakdown</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="date" stroke="#475569" fontSize={10} fontStyle="italic" fontWeight="bold" />
                            <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                cursor={{fill: '#1e293b'}} 
                                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                {dailyChartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, positive, icon: Icon, color }: any) => (
    <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
            <div className={`p-2 rounded-lg bg-slate-800`}>
                <Icon className={`h-4 w-4 ${positive === false ? 'text-rose-500' : 'text-gold-500'}`} />
            </div>
        </div>
        <h3 className={`text-2xl font-black italic tracking-tighter ${positive === false ? 'text-rose-500' : 'text-white'}`}>{value}</h3>
    </div>
);
