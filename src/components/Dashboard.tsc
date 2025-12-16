import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface DashboardProps {
    trades: Trade[];
    accountBalance: number;
}

type Interval = 'DAY' | 'WEEK' | 'MONTH';
type ChartType = 'LINE' | 'BAR';

export const Dashboard: React.FC<DashboardProps> = ({ trades, accountBalance }) => {
    const [interval, setInterval] = useState<Interval>('DAY');
    const [chartType, setChartType] = useState<ChartType>('LINE');
    
    const stats = useMemo(() => {
        const closedTrades = trades.filter(t => t.status === 'CLOSED');
        const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
        const wins = closedTrades.filter(t => t.pnl > 0).length;
        const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
        const profitFactor = Math.abs(closedTrades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0) / (closedTrades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0) || 1));

        return {
            totalPnl,
            winRate,
            profitFactor,
            tradeCount: closedTrades.length
        };
    }, [trades]);

    // Group Data Logic
    const chartData = useMemo(() => {
        const closedTrades = trades
            .filter(t => t.status === 'CLOSED')
            .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

        if (interval === 'DAY') {
             let runningBalance = 0;
             return closedTrades.map(t => {
                runningBalance += t.pnl;
                return {
                    date: new Date(t.entryDate).toLocaleDateString(),
                    pnl: t.pnl,
                    balance: runningBalance
                };
             });
        }

        const groupedMap = new Map<string, { pnl: number, count: number }>();
        let runningBalance = 0;

        closedTrades.forEach(t => {
            const date = new Date(t.entryDate);
            let key = '';
            
            if (interval === 'WEEK') {
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
                const monday = new Date(d.setDate(diff));
                key = monday.toLocaleDateString();
            } else if (interval === 'MONTH') {
                key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            }

            const current = groupedMap.get(key) || { pnl: 0, count: 0 };
            groupedMap.set(key, { pnl: current.pnl + t.pnl, count: current.count + 1 });
        });

        const result: any[] = [];
        for (const [key, val] of groupedMap.entries()) {
            runningBalance += val.pnl;
            result.push({
                date: key,
                pnl: val.pnl,
                balance: runningBalance
            });
        }
        return result;

    }, [trades, interval]);

    return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Trading Overview</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-1 border-r border-slate-200 dark:border-slate-700 pr-3">
                        {(['DAY', 'WEEK', 'MONTH'] as Interval[]).map(i => (
                            <button
                                key={i}
                                onClick={() => setInterval(i)}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${interval === i ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                    <div className="flex space-x-1">
                         <button
                            onClick={() => setChartType('LINE')}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${chartType === 'LINE' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                         >
                            Line
                         </button>
                         <button
                            onClick={() => setChartType('BAR')}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${chartType === 'BAR' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                         >
                            Bar
                         </button>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="Net P&L" 
                    value={`$${stats.totalPnl.toFixed(2)}`} 
                    positive={stats.totalPnl >= 0} 
                    icon={DollarSign}
                />
                <StatCard 
                    label="Win Rate" 
                    value={`${stats.winRate.toFixed(1)}%`} 
                    icon={Activity} 
                    color="blue"
                />
                <StatCard 
                    label="Profit Factor" 
                    value={stats.profitFactor.toFixed(2)} 
                    icon={TrendingUp} 
                    color="gold"
                />
                <StatCard 
                    label="Total Trades" 
                    value={stats.tradeCount.toString()} 
                    icon={TrendingDown} 
                    color="purple"
                />
            </div>

            {/* Main Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">Growth Overview</h3>
                <div className="h-[350px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        {chartType === 'LINE' ? (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#334155', color: '#f8fafc' }}
                                    itemStyle={{ color: '#eab308' }}
                                    wrapperClassName="dark:bg-slate-900 dark:border-slate-700 bg-white border-slate-200 text-slate-900 dark:text-white"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="balance" 
                                    stroke="#eab308" 
                                    strokeWidth={3} 
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#eab308' }}
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} dy={10} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#334155', opacity: 0.2}}
                                    contentStyle={{ backgroundColor: 'var(--tw-prose-invert-bg)', borderColor: '#334155', color: '#f8fafc' }}
                                    wrapperClassName="dark:bg-slate-900 dark:border-slate-700 bg-white border-slate-200 text-slate-900 dark:text-white"
                                />
                                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, positive, icon: Icon, color }: any) => {
    const colorClass = positive === undefined 
        ? (color === 'blue' ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' : color === 'gold' ? 'text-gold-500 bg-gold-50 dark:bg-gold-500/10' : 'text-purple-500 bg-purple-50 dark:bg-purple-500/10')
        : (positive ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10');
        
    const textClass = positive === undefined ? 'text-slate-900 dark:text-slate-100' : (positive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400');

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                <div className={`p-2 rounded-lg ${colorClass.split(' ')[1]}`}>
                    <Icon className={`h-5 w-5 ${colorClass.split(' ')[0]}`} />
                </div>
            </div>
            <h3 className={`text-2xl font-bold ${textClass}`}>{value}</h3>
        </div>
    )
}
