import React, { useMemo } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticsProps {
    trades: Trade[];
    accountBalance: number;
    currentBalance: number;
}

export const Analytics: React.FC<AnalyticsProps> = ({ trades, accountBalance, currentBalance }) => {
    const closedTrades = useMemo(() => trades.filter(t => t.status === 'CLOSED'), [trades]);

    const stats = useMemo(() => {
        const wins = closedTrades.filter(t => t.pnl > 0);
        const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
        const totalProfit = wins.reduce((s, t) => s + t.pnl, 0);
        const totalLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
        const profitFactor = totalProfit / (totalLoss || 1);
        return { 
            winRate, 
            profitFactor, 
            totalTrades: closedTrades.length, 
            net: currentBalance - accountBalance,
            avgWin: wins.length > 0 ? totalProfit / wins.length : 0,
            avgLoss: closedTrades.length > wins.length ? totalLoss / (closedTrades.length - wins.length) : 0
        };
    }, [closedTrades, currentBalance, accountBalance]);

    const weekdayData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(d => ({ day: d, pnl: 0 }));
        closedTrades.forEach(t => {
            const dayIdx = new Date(t.entryDate).getDay();
            data[dayIdx].pnl += t.pnl;
        });
        return data;
    }, [closedTrades]);

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden max-h-[calc(100vh-100px)]">
            <header className="flex justify-between items-end shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Command Center</h2>
                    <p className="text-slate-500 text-xs italic mt-1 uppercase tracking-widest font-bold">Strategic Performance Intelligence</p>
                </div>
                <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                   <p className="text-[10px] font-black text-gold-500 uppercase tracking-widest">Global P/L Yield</p>
                   <p className={`text-lg font-black italic ${stats.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stats.net >= 0 ? '+' : '-'}${Math.abs(stats.net).toLocaleString()}
                   </p>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
                {/* Stats Sidebar */}
                <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                           <Activity className="h-4 w-4 text-gold-500" />
                           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Core Metrics</h3>
                        </div>
                        <StatItem label="Win Probability" value={`${stats.winRate.toFixed(1)}%`} />
                        <StatItem label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
                        <StatItem label="Sample Size" value={`${stats.totalTrades} Trades`} />
                        <StatItem label="Avg Profit" value={`$${stats.avgWin.toFixed(0)}`} highlight />
                        <StatItem label="Avg Drawdown" value={`$${stats.avgLoss.toFixed(0)}`} isLoss />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                           <Zap className="h-4 w-4 text-gold-500" />
                           <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Balance State</h3>
                        </div>
                        <StatItem label="Initial Deposit" value={`$${accountBalance.toLocaleString()}`} />
                        <StatItem label="Current Equity" value={`$${currentBalance.toLocaleString()}`} highlight />
                    </div>
                </div>

                {/* Main Graph Area */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                       <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Institutional Yield By Session</h3>
                       <div className="flex gap-2">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[8px] font-black uppercase text-slate-500">Profit</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                <span className="text-[8px] font-black uppercase text-slate-500">Loss</span>
                            </div>
                       </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weekdayData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="day" stroke="#475569" fontSize={10} fontStyle="italic" fontWeight="bold" />
                                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                                <Bar dataKey="pnl">
                                    {weekdayData.map((e, i) => (
                                        <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ label, value, highlight, isLoss }: any) => (
    <div className={`flex justify-between items-center py-2 border-b border-slate-800/50 ${highlight ? 'text-gold-500' : ''}`}>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-black italic tracking-tighter ${highlight ? 'text-gold-500 text-lg' : isLoss ? 'text-rose-500' : 'text-white'}`}>{value}</span>
    </div>
);
