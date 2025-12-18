import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { HelpCircle, BarChart2, PieChart as PieChartIcon, Clock, Percent } from 'lucide-react';

interface AnalyticsProps {
    trades: Trade[];
    accountBalance: number;
}

type GraphTab = 'WEEKDAY' | 'HOUR' | 'SYMBOL' | 'RATIO';

export const Analytics: React.FC<AnalyticsProps> = ({ trades, accountBalance }) => {
    const [activeGraph, setActiveGraph] = useState<GraphTab>('WEEKDAY');

    // Detailed Stats Calculation
    const stats = useMemo(() => {
        const closedTrades = trades.filter(t => t.status === 'CLOSED');
        const winningTrades = closedTrades.filter(t => t.pnl > 0);
        const losingTrades = closedTrades.filter(t => t.pnl <= 0);
        
        const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
        const grossProfit = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = losingTrades.reduce((acc, t) => acc + t.pnl, 0);
        
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
        const lossRate = 100 - winRate;
        const profitFactor = Math.abs(grossProfit / (grossLoss || 1));
        
        const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
        
        const totalLots = closedTrades.reduce((acc, t) => acc + (t.quantity || 0), 0);
        
        const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl)) : 0;
        const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl)) : 0;

        const longTrades = closedTrades.filter(t => t.direction === 'LONG');
        const longWon = longTrades.length > 0 ? (longTrades.filter(t => t.pnl > 0).length / longTrades.length) * 100 : 0;
        
        const shortTrades = closedTrades.filter(t => t.direction === 'SHORT');
        const shortWon = shortTrades.length > 0 ? (shortTrades.filter(t => t.pnl > 0).length / shortTrades.length) * 100 : 0;

        return {
            balance: accountBalance,
            equity: accountBalance, 
            profitability: winRate,
            avgWin,
            avgLoss,
            totalTrades: closedTrades.length,
            totalLots,
            avgRRR: Math.abs(avgWin / (avgLoss || 1)).toFixed(2),
            winRate,
            lossRate,
            profitFactor,
            bestTrade,
            worstTrade,
            longWon,
            shortWon,
            grossProfit,
            grossLoss
        };
    }, [trades, accountBalance]);

    // Graph Data Helpers
    const symbolPerformance = useMemo(() => {
        const map = new Map<string, number>();
        trades.filter(t => t.status === 'CLOSED').forEach(t => {
            map.set(t.symbol, (map.get(t.symbol) || 0) + 1); 
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [trades]);

    const pnlByWeekday = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(d => ({ day: d, pnl: 0 }));
        trades.filter(t => t.status === 'CLOSED').forEach(t => {
            const dayIndex = new Date(t.entryDate).getDay();
            data[dayIndex].pnl += t.pnl;
        });
        return data;
    }, [trades]);

    const pnlByHour = useMemo(() => {
        const data = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, pnl: 0 }));
        trades.filter(t => t.status === 'CLOSED').forEach(t => {
            const hour = new Date(t.entryDate).getHours();
            data[hour].pnl += t.pnl;
        });
        return data;
    }, [trades]);

    const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899', '#6366f1'];

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analytics</h2>
                <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700">Detailed Statistics</span>
                </div>
            </header>

            {/* Detailed Stats Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <StatRow label="Equity" value={`$${stats.equity.toFixed(2)}`} />
                        <StatRow label="Balance" value={`$${stats.balance.toFixed(2)}`} />
                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">Profitability</div>
                            <div className="flex items-center w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div style={{width: `${stats.winRate}%`}} className="h-full bg-emerald-500"></div>
                                <div style={{width: `${stats.lossRate}%`}} className="h-full bg-rose-500"></div>
                            </div>
                        </div>
                        <StatRow label="Avg. Winning Trade" value={`$${stats.avgWin.toFixed(2)}`} />
                        <StatRow label="Avg. Losing Trade" value={`-$${Math.abs(stats.avgLoss).toFixed(2)}`} />
                        <StatRow label="Trades" value={stats.totalTrades.toString()} />
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <StatRow label="Lots" value={stats.totalLots.toFixed(2)} />
                        <StatRow label="Avg. RRR" value={`1:${stats.avgRRR}`} />
                        <StatRow label="Win Rate" value={`${stats.winRate.toFixed(2)}%`} />
                        <StatRow label="Loss Rate" value={`${stats.lossRate.toFixed(2)}%`} />
                        <StatRow label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
                        <StatRow label="Best Trade" value={`$${stats.bestTrade.toFixed(2)}`} />
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                        <StatRow label="Worst Trade" value={`$${stats.worstTrade.toFixed(2)}`} />
                        <StatRow label="Long Won" value={`${stats.longWon.toFixed(2)}%`} />
                        <StatRow label="Short Won" value={`${stats.shortWon.toFixed(2)}%`} />
                        <StatRow label="Gross Profit" value={`$${stats.grossProfit.toFixed(2)}`} />
                        <StatRow label="Gross Loss" value={`-$${Math.abs(stats.grossLoss).toFixed(2)}`} />
                    </div>
                </div>
            </div>

            {/* Graphs Section with Tabs */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Performance Graphs</h3>
                    
                    <div className="flex p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                        <button
                            onClick={() => setActiveGraph('WEEKDAY')}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeGraph === 'WEEKDAY' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <BarChart2 className="h-4 w-4 mr-2" />
                            Weekday PnL
                        </button>
                        <button
                            onClick={() => setActiveGraph('HOUR')}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeGraph === 'HOUR' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            Hourly PnL
                        </button>
                         <button
                            onClick={() => setActiveGraph('SYMBOL')}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeGraph === 'SYMBOL' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <PieChartIcon className="h-4 w-4 mr-2" />
                            Volume by Pair
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[400px]">
                    
                    {activeGraph === 'WEEKDAY' && (
                        <div className="h-[400px] w-full min-w-0 animate-in fade-in duration-300">
                             <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 text-center">Profit/Loss by Weekday</h4>
                             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={pnlByWeekday}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" vertical={false} opacity={0.2} />
                                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip 
                                        cursor={{fill: '#334155', opacity: 0.1}} 
                                        contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#334155', color: '#f8fafc' }}
                                        wrapperClassName="dark:bg-slate-900 dark:border-slate-700 bg-white border-slate-200 text-slate-900 dark:text-white"
                                    />
                                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                        {pnlByWeekday.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#6366f1' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {activeGraph === 'HOUR' && (
                         <div className="h-[400px] w-full min-w-0 animate-in fade-in duration-300">
                             <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 text-center">Profit/Loss by Hour of Day</h4>
                             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={pnlByHour}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" vertical={false} opacity={0.2} />
                                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip 
                                        cursor={{fill: '#334155', opacity: 0.1}} 
                                        contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#334155', color: '#f8fafc' }}
                                        wrapperClassName="dark:bg-slate-900 dark:border-slate-700 bg-white border-slate-200 text-slate-900 dark:text-white"
                                    />
                                    <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                                        {pnlByHour.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#6366f1' : '#f43f5e'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {activeGraph === 'SYMBOL' && (
                        <div className="h-[400px] w-full min-w-0 animate-in fade-in duration-300">
                            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 text-center">Trade Volume by Instrument</h4>
                             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={symbolPerformance}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={100}
                                        outerRadius={140}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {symbolPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="rgba(0,0,0,0.2)" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#334155', color: '#f8fafc' }}
                                        wrapperClassName="dark:bg-slate-900 dark:border-slate-700 bg-white border-slate-200 text-slate-900 dark:text-white"
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 px-2 rounded transition-colors">
        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
            {label} 
        </div>
        <div className="text-slate-800 dark:text-slate-200 font-medium">{value}</div>
    </div>
);