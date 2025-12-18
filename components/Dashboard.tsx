import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { CalendarView } from './CalendarView';
import { TrendingUp, TrendingDown, Info, Gauge, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface DashboardProps {
    trades: Trade[];
    accountBalance: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ trades, accountBalance }) => {
    const stats = useMemo(() => {
        const closed = trades.filter(t => t.status === 'CLOSED');
        const netPnl = closed.reduce((acc, t) => acc + t.pnl, 0);
        const wins = closed.filter(t => t.pnl > 0);
        const losses = closed.filter(t => t.pnl <= 0);
        const profitFactor = Math.abs(wins.reduce((acc, t) => acc + t.pnl, 0) / (losses.reduce((acc, t) => acc + t.pnl, 0) || 1));
        const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
        return { netPnl, profitFactor, winRate, tradeCount: closed.length };
    }, [trades]);

    const radarData = [
        { subject: 'Win %', A: stats.winRate, fullMark: 100 },
        { subject: 'Risk/Reward', A: 75, fullMark: 100 },
        { subject: 'Consistency', A: 85, fullMark: 100 },
        { subject: 'Psychology', A: 60, fullMark: 100 },
        { subject: 'Volume', A: 90, fullMark: 100 },
    ];

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Good morning!</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard label="Net P&L" value={`$${stats.netPnl.toLocaleString()}`} color="emerald" info="Total profit/loss for the selected period after fees." />
                <MetricCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} color="indigo" info="Ratio of gross profit to gross loss. Above 1.0 is profitable." isCircle />
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm group relative">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Streak</span>
                        <div className="group/tip relative">
                            <Info className="h-3 w-3 text-slate-300 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none">
                                Your current winning or losing run sequence.
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 items-end mt-4">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Days</p>
                           <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center font-black text-emerald-500">1</div>
                        </div>
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Trades</p>
                           <div className="w-10 h-10 rounded-full border-2 border-rose-500 flex items-center justify-center font-black text-rose-500">{stats.tradeCount}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-indigo-600 rounded-xl p-5 shadow-lg shadow-indigo-500/20 text-white flex flex-col justify-center">
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Quick Action</p>
                    <h3 className="text-lg font-bold italic tracking-tight">Review your performance</h3>
                    <div className="mt-2 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-2/3"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                    <CalendarView trades={trades} currencySymbol="$" />
                </div>

                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Balance & P&L</h4>
                            <Zap className="h-4 w-4 text-indigo-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">${(accountBalance + stats.netPnl).toLocaleString()}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">P&L:</span>
                            <span className={`text-sm font-black ${stats.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stats.netPnl >= 0 ? '+' : '-'}${Math.abs(stats.netPnl).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm text-center">
                        <div className="flex justify-between items-start mb-4 text-left">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Trade Win %</h4>
                        </div>
                        <div className="relative h-24 flex items-center justify-center">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white z-10">{stats.winRate.toFixed(1)}%</h3>
                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                <Gauge className="h-20 w-20 text-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Wick Score</h4>
                            <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 rounded">BETA</span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#475569" strokeOpacity={0.2} />
                                    <PolarAngleAxis dataKey="subject" fontSize={8} fontWeight="bold" stroke="#94a3b8" />
                                    <Radar name="Trader" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-400 uppercase">Terminal Score:</span>
                           <span className="text-xl font-black text-emerald-500 italic">81.25</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, color, info, isCircle }: any) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between group relative">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
                <div className="group/tip relative">
                    <Info className="h-3 w-3 text-slate-300 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none">
                        {info}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
                <h3 className={`text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white ${color === 'emerald' ? 'text-emerald-500' : ''}`}>
                    {value}
                </h3>
                {isCircle && <div className="w-8 h-8 rounded-full border-4 border-rose-500 border-r-emerald-500 ml-auto"></div>}
            </div>
        </div>
    );
};
