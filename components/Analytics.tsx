import React, { useMemo, useState } from 'react';
import { Trade } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { HelpCircle, Search, RotateCcw } from 'lucide-react';

interface AnalyticsProps {
    trades: Trade[];
    accountBalance: number;
    currentBalance: number;
}

type Tab = 'DETAILED' | 'ANALYTICS';
type GraphTab = 'SYMBOL' | 'WEEKDAY' | 'HOUR' | 'ORDER' | 'WINLOSS';

export const Analytics: React.FC<AnalyticsProps> = ({ trades, accountBalance, currentBalance }) => {
    const [activeTab, setActiveTab] = useState<Tab>('DETAILED');
    const [activeGraph, setActiveGraph] = useState<GraphTab>('SYMBOL');

    const closedTrades = useMemo(() => trades.filter(t => t.status === 'CLOSED'), [trades]);

    const stats = useMemo(() => {
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

        const longs = closedTrades.filter(t => t.direction === 'LONG');
        const longWon = longs.length > 0 ? (longs.filter(t => t.pnl > 0).length / longs.length) * 100 : 0;
        const shorts = closedTrades.filter(t => t.direction === 'SHORT');
        const shortWon = shorts.length > 0 ? (shorts.filter(t => t.pnl > 0).length / shorts.length) * 100 : 0;

        return {
            equity: currentBalance,
            balance: currentBalance, // In this app we assume balance = equity for simplicity
            profitability: winRate,
            avgWin,
            avgLoss,
            totalTrades: closedTrades.length,
            totalLots,
            avgRRR: `1:${Math.abs(avgWin / (avgLoss || 1)).toFixed(2)}`,
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
    }, [closedTrades, currentBalance]);

    // Graph Data
    const symbolData = useMemo(() => {
        const map = new Map<string, number>();
        closedTrades.forEach(t => map.set(t.symbol, (map.get(t.symbol) || 0) + 1));
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [closedTrades]);

    const weekdayData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(d => ({ day: d, pnl: 0 }));
        closedTrades.forEach(t => { data[new Date(t.entryDate).getDay()].pnl += t.pnl; });
        return data;
    }, [closedTrades]);

    const hourData = useMemo(() => {
        const data = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, pnl: 0 }));
        closedTrades.forEach(t => { data[new Date(t.entryDate).getHours()].pnl += t.pnl; });
        return data;
    }, [closedTrades]);

    const orderTypeData = useMemo(() => {
        const buyPnl = closedTrades.filter(t => t.direction === 'LONG').reduce((s, t) => s + t.pnl, 0);
        const sellPnl = closedTrades.filter(t => t.direction === 'SHORT').reduce((s, t) => s + t.pnl, 0);
        return [
            { name: 'Buy', pnl: buyPnl },
            { name: 'Sell', pnl: sellPnl }
        ];
    }, [closedTrades]);

    const winLossData = useMemo(() => [
        { name: 'Win Ratio (%)', value: stats.winRate },
        { name: 'Loss Ratio (%)', value: stats.lossRate }
    ], [stats]);

    const growthData = useMemo(() => {
        let running = accountBalance;
        return closedTrades
            .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
            .map(t => {
                running += t.pnl;
                return { date: new Date(t.entryDate).toLocaleDateString(), balance: running, equity: running };
            });
    }, [closedTrades, accountBalance]);

    const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];
    const PIE_COLORS = ['#6366f1', '#c7d2fe'];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                        <BarChart2 className="h-4 w-4 text-slate-900 dark:text-white" />
                    </div>
                    <h2 className="font-bold text-slate-900 dark:text-white">Trading Overview</h2>
                </div>

                <div className="p-6">
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg w-fit mb-8 border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setActiveTab('DETAILED')} className={`px-8 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'DETAILED' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Detailed Stats</button>
                        <button onClick={() => setActiveTab('ANALYTICS')} className={`px-8 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'ANALYTICS' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Analytics</button>
                    </div>

                    {activeTab === 'DETAILED' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-2 animate-in fade-in duration-300">
                            <div className="space-y-1">
                                <StatItem label="Equity" value={`$${stats.equity.toLocaleString()}`} hasHelp />
                                <StatItem label="Balance" value={`$${stats.balance.toLocaleString()}`} hasHelp />
                                <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800/50">
                                    <span className="text-sm text-slate-500">Profitability</span>
                                    <div className="w-32 h-3 flex bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div style={{width: `${stats.winRate}%`}} className="bg-emerald-500 h-full"></div>
                                        <div style={{width: `${stats.lossRate}%`}} className="bg-rose-500 h-full"></div>
                                    </div>
                                </div>
                                <StatItem label="Avg. Winning Trade" value={`$${stats.avgWin.toFixed(2)}`} hasHelp />
                                <StatItem label="Avg. Losing Trade" value={`-$${Math.abs(stats.avgLoss).toFixed(2)}`} hasHelp />
                                <StatItem label="Trades" value={stats.totalTrades.toString()} hasHelp />
                            </div>
                            <div className="space-y-1">
                                <StatItem label="Lots" value={stats.totalLots.toFixed(2)} hasHelp />
                                <StatItem label="Avg. RRR" value={stats.avgRRR} hasHelp />
                                <StatItem label="Win Rate" value={`${stats.winRate.toFixed(2)}%`} hasHelp />
                                <StatItem label="Loss Rate" value={`${stats.lossRate.toFixed(2)}%`} />
                                <StatItem label="Profit Factor" value={stats.profitFactor.toFixed(2)} />
                                <StatItem label="Best Trade" value={`$${stats.bestTrade.toFixed(2)}`} />
                            </div>
                            <div className="space-y-1">
                                <StatItem label="Worst Trade" value={`$${stats.worstTrade.toFixed(2)}`} />
                                <StatItem label="Long Won" value={`${stats.longWon.toFixed(2)}%`} />
                                <StatItem label="Short Won" value={`${stats.shortWon.toFixed(2)}%`} />
                                <StatItem label="Gross Profit" value={`$${stats.grossProfit.toFixed(2)}`} />
                                <StatItem label="Gross Loss" value={`$${stats.grossLoss.toFixed(2)}`} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in duration-300">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Trade Growth View</h3>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 text-xs border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                                            <span className="text-slate-400">Filter By Date:</span>
                                            <span className="text-slate-300">Start date → End date</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={growthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                            <XAxis dataKey="date" hide />
                                            <YAxis stroke="#999" fontSize={10} domain={['auto', 'auto']} />
                                            <Tooltip />
                                            <Legend align="right" verticalAlign="top" iconType="circle" />
                                            <Line type="monotone" dataKey="equity" stroke="#f43f5e" strokeDasharray="5 5" dot={{ r: 4, fill: '#f43f5e' }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="balance" stroke="#6366f1" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-6">Graph</h3>
                                <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg w-fit mb-8 border border-slate-200 dark:border-slate-700">
                                    <GraphTabBtn active={activeGraph === 'SYMBOL'} onClick={() => setActiveGraph('SYMBOL')}>Symbol Performance</GraphTabBtn>
                                    <GraphTabBtn active={activeGraph === 'WEEKDAY'} onClick={() => setActiveGraph('WEEKDAY')}>PnL by Weekday</GraphTabBtn>
                                    <GraphTabBtn active={activeGraph === 'HOUR'} onClick={() => setActiveGraph('HOUR')}>PnL by Hours</GraphTabBtn>
                                    <GraphTabBtn active={activeGraph === 'ORDER'} onClick={() => setActiveGraph('ORDER')}>PnL Order Type</GraphTabBtn>
                                    <GraphTabBtn active={activeGraph === 'WINLOSS'} onClick={() => setActiveGraph('WINLOSS')}>Win/ Loss Ratio</GraphTabBtn>
                                </div>

                                <div className="min-h-[400px] flex items-center justify-center">
                                    {activeGraph === 'SYMBOL' && (
                                        <div className="flex w-full h-[400px]">
                                            <div className="flex-1">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={symbolData} cx="50%" cy="50%" outerRadius={150} dataKey="value">
                                                            {symbolData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend verticalAlign="bottom" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="w-64 border-l border-slate-100 dark:border-slate-800 p-6 space-y-4">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                                    <input type="text" placeholder="Search" className="w-full pl-9 py-2 text-sm bg-transparent border-b border-slate-200 outline-none" />
                                                </div>
                                                <button className="text-sm text-indigo-500">Reset All</button>
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {symbolData.map(s => (
                                                        <div key={s.name} className="flex items-center gap-2">
                                                            <input type="checkbox" checked className="rounded border-slate-300 text-indigo-600" />
                                                            <span className="text-sm text-slate-700 dark:text-slate-300 font-bold">{s.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeGraph === 'WEEKDAY' && (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={weekdayData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                                <XAxis dataKey="day" stroke="#999" fontSize={12} />
                                                <YAxis stroke="#999" fontSize={12} />
                                                <Tooltip cursor={{fill: 'transparent'}} />
                                                <Bar dataKey="pnl" fill="#6366f1" radius={[2, 2, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                    {activeGraph === 'HOUR' && (
                                        <div className="w-full space-y-4">
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={hourData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                                    <XAxis dataKey="hour" stroke="#999" fontSize={10} />
                                                    <YAxis stroke="#999" fontSize={10} />
                                                    <Tooltip />
                                                    <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                                                        {hourData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? '#6366f1' : '#f43f5e'} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                            <div className="text-center text-xs text-slate-500 font-bold uppercase">Timezone: GMT+2</div>
                                        </div>
                                    )}
                                    {activeGraph === 'ORDER' && (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart data={orderTypeData} barSize={40}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                                <XAxis dataKey="name" stroke="#999" fontSize={12} />
                                                <YAxis stroke="#999" fontSize={12} />
                                                <Tooltip />
                                                <Bar dataKey="pnl">
                                                    <Cell fill="#6366f1" />
                                                    <Cell fill="#f43f5e" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                    {activeGraph === 'WINLOSS' && (
                                        <ResponsiveContainer width="100%" height={400}>
                                            <PieChart>
                                                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={0} outerRadius={150} dataKey="value">
                                                    {winLossData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ label, value, hasHelp }: { label: string, value: string, hasHelp?: boolean }) => (
    <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-500">{label}</span>
            {hasHelp && <HelpCircle className="h-3 w-3 text-slate-400" />}
        </div>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
);

const GraphTabBtn = ({ active, children, onClick }: any) => (
    <button onClick={onClick} className={`px-4 py-2 text-xs font-bold rounded transition-all whitespace-nowrap border-r border-slate-200 dark:border-slate-700 last:border-0 ${active ? 'bg-indigo-900/20 text-indigo-400' : 'text-slate-500'}`}>{children}</button>
);

const BarChart2 = ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
);
