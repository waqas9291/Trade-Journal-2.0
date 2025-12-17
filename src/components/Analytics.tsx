import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart2, PieChart as PieChartIcon, Clock, Filter, Calendar } from 'lucide-react';

interface AnalyticsProps {
    trades: Trade[];
    accountBalance: number; // This acts as Initial Balance
}

type GraphTab = 'WEEKDAY' | 'HOUR' | 'SYMBOL' | 'RATIO';
type TimeFilter = 'ALL' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_7_DAYS' | 'LAST_30_DAYS';

export const Analytics: React.FC<AnalyticsProps> = ({ trades, accountBalance }) => {
    const [activeGraph, setActiveGraph] = useState<GraphTab>('WEEKDAY');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

    // Filtering Logic
    const filteredTrades = useMemo(() => {
        const now = new Date();
        return trades.filter(t => {
            if (t.status !== 'CLOSED') return false; // Only analyze closed trades for stats
            
            const tradeDate = new Date(t.entryDate);
            
            switch(timeFilter) {
                case 'THIS_WEEK': {
                    const firstDay = now.getDate() - now.getDay();
                    const weekStart = new Date(now.setDate(firstDay));
                    weekStart.setHours(0,0,0,0);
                    return tradeDate >= weekStart;
                }
                case 'THIS_MONTH': {
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return tradeDate >= monthStart;
                }
                case 'LAST_MONTH': {
                    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                    return tradeDate >= lastMonthStart && tradeDate <= lastMonthEnd;
                }
                case 'LAST_7_DAYS': {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return tradeDate >= sevenDaysAgo;
                }
                case 'LAST_30_DAYS': {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return tradeDate >= thirtyDaysAgo;
                }
                default: return true;
            }
        });
    }, [trades, timeFilter]);

    // Detailed Stats Calculation
    const stats = useMemo(() => {
        const closedTrades = filteredTrades;
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

        // Current Balance Logic: Initial + Total PnL (of the filtered range? No, Current Balance implies Account State)
        // However, if we filter by date, showing "Current Balance" based on ALL trades makes sense, 
        // OR we show "Net PnL for Period". 
        // The user asked for "Initial Balance" and "Current Balance".
        // To respect the filter, "Initial Balance" here might mean "Balance at Start of Period".
        // But for simplicity and clarity given the app structure:
        // Initial Balance = accountBalance (Static setting from Account)
        // Current Balance = accountBalance + (Sum of ALL trades PnL, not just filtered).
        
        // Let's calculate TOTAL accumulated PnL for the Current Balance
        const allClosedTrades = trades.filter(t => t.status === 'CLOSED');
        const totalAccumulatedPnl = allClosedTrades.reduce((acc, t) => acc + t.pnl, 0);
        const currentBalance = accountBalance + totalAccumulatedPnl;

        return {
            initialBalance: accountBalance,
            currentBalance: currentBalance, 
            periodPnl: totalPnl,
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
    }, [filteredTrades, trades, accountBalance]);

    // Graph Data Helpers
    const symbolPerformance = useMemo(() => {
        const map = new Map<string, number>();
        filteredTrades.forEach(t => {
            map.set(t.symbol, (map.get(t.symbol) || 0) + 1); 
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredTrades]);

    const pnlByWeekday = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(d => ({ day: d, pnl: 0 }));
        filteredTrades.forEach(t => {
            const dayIndex = new Date(t.entryDate).getDay();
            data[dayIndex].pnl += t.pnl;
        });
        return data;
    }, [filteredTrades]);

    const pnlByHour = useMemo(() => {
        const data = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, pnl: 0 }));
        filteredTrades.forEach(t => {
            const hour = new Date(t.entryDate).getHours();
            data[hour].pnl += t.pnl;
        });
        return data;
    }, [filteredTrades]);

    const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899', '#6366f1'];

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Detailed Performance Breakdown</p>
                </div>
                
                {/* Time Filter */}
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Filter className="h-4 w-4 text-slate-400 ml-2" />
                    <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                        className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer outline-none"
                    >
                        <option value="ALL">All Time</option>
                        <option value="THIS_WEEK">This Week</option>
                        <option value="LAST_7_DAYS">Last 7 Days</option>
                        <option value="THIS_MONTH">This Month</option>
                        <option value="LAST_MONTH">Last Month</option>
                        <option value="LAST_30_DAYS">Last 30 Days</option>
                    </select>
                </div>
            </header>

            {/* Detailed Stats Grid */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <StatRow label="Current Balance" value={`$${stats.currentBalance.toFixed(2)}`} highlight />
                        <StatRow label="Initial Balance" value={`$${stats.initialBalance.toFixed(2)}`} />
                        <StatRow label={`Net P&L (${timeFilter.replace('_', ' ').toLowerCase()})`} value={`$${stats.periodPnl.toFixed(2)}`} 
                            valueColor={stats.periodPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'} 
                        />
                         <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">Profitability</div>
                            <div className="flex items-center w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div style={{width: `${stats.winRate}%`}} className="h-full bg-emerald-500"></div>
                                <div style={{width: `${stats.lossRate}%`}} className="h-full bg-rose-500"></div>
                            </div>
                        </div>
                        <StatRow label="Trades" value={stats.totalTrades.toString()} />
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <StatRow label="Lots Traded" value={stats.totalLots.toFixed(2)} />
                        <StatRow label="Avg. RRR" value={`1:${stats.avgRRR}`} />
                        <StatRow label="Win Rate" value={`${stats.winRate.toFixed(2)}%`} />
                        <StatRow label="Loss Rate" value={`${stats.lossRate.toFixed(2)}%`} />
                        <StatRow label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
                        <StatRow label="Best Trade" value={`$${stats.bestTrade.toFixed(2)}`} valueColor="text-emerald-500" />
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                        <StatRow label="Worst Trade" value={`$${stats.worstTrade.toFixed(2)}`} valueColor="text-rose-500" />
                        <StatRow label="Avg. Win" value={`$${stats.avgWin.toFixed(2)}`} />
                        <StatRow label="Avg. Loss" value={`-$${Math.abs(stats.avgLoss).toFixed(2)}`} />
                        <StatRow label="Long Won" value={`${stats.longWon.toFixed(2)}%`} />
                        <StatRow label="Short Won" value={`${stats.shortWon.toFixed(2)}%`} />
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

const StatRow = ({ label, value, valueColor, highlight }: { label: string, value: string, valueColor?: string, highlight?: boolean }) => (
    <div className={`flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 px-2 rounded transition-colors ${highlight ? 'bg-gold-50/50 dark:bg-gold-500/10 border-gold-200' : ''}`}>
        <div className={`flex items-center text-sm ${highlight ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
            {label} 
        </div>
        <div className={`font-medium ${valueColor ? valueColor : (highlight ? 'text-gold-600 dark:text-gold-500 font-bold' : 'text-slate-800 dark:text-slate-200')}`}>{value}</div>
    </div>
);
