import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BacktestSession, BacktestTrade } from '../types';
import { Plus, Microscope, Trash2, LineChart as ChartIcon, History, TrendingUp, Target, Save, X, ChevronLeft, Play, BarChart3, Layout, Clock, Activity, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface BacktestingProps {
    sessions: BacktestSession[];
    trades: BacktestTrade[];
    onAddSession: (session: BacktestSession) => void;
    onDeleteSession: (id: string) => void;
    onAddTrade: (trade: BacktestTrade) => void;
    onDeleteTrade: (id: string) => void;
}

export const Backtesting: React.FC<BacktestingProps> = ({ 
    sessions, 
    trades, 
    onAddSession, 
    onDeleteSession, 
    onAddTrade, 
    onDeleteTrade 
}) => {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [isAddingSession, setIsAddingSession] = useState(false);
    const [isAddingTrade, setIsAddingTrade] = useState(false);
    const [activeTimeframe, setActiveTimeframe] = useState('15');
    const [viewMode, setViewMode] = useState<'SIMULATE' | 'ANALYTICS'>('SIMULATE');
    
    const containerRef = useRef<HTMLDivElement>(null);

    const activeSession = useMemo(() => 
        sessions.find(s => s.id === selectedSessionId), 
    [sessions, selectedSessionId]);

    const sessionTrades = useMemo(() => 
        trades.filter(t => t.sessionId === selectedSessionId)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [trades, selectedSessionId]);

    // TradingView Widget Injection
    useEffect(() => {
        if (!selectedSessionId || viewMode !== 'SIMULATE' || !activeSession) return;
        
        const chartId = `tv-backtest-${selectedSessionId}`;
        const container = document.getElementById(chartId);
        if (!container) return;
        container.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": activeSession.symbol.includes(':') ? activeSession.symbol : `FX:${activeSession.symbol}`,
            "interval": activeTimeframe,
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "allow_symbol_change": true,
            "save_image": false,
            "container_id": chartId,
            "studies": ["STD;EMA;20", "STD;EMA;50", "STD;RSI"]
        });
        container.appendChild(script);
    }, [selectedSessionId, viewMode, activeTimeframe, activeSession]);

    const stats = useMemo(() => {
        if (!activeSession) return null;
        const totalPnl = sessionTrades.reduce((acc, t) => acc + t.pnl, 0);
        const wins = sessionTrades.filter(t => t.result === 'WIN');
        const losses = sessionTrades.filter(t => t.result === 'LOSS');
        const winRate = sessionTrades.length > 0 ? (wins.length / sessionTrades.length) * 100 : 0;
        const avgR = sessionTrades.length > 0 ? sessionTrades.reduce((acc, t) => acc + t.rMultiple, 0) / sessionTrades.length : 0;
        
        const expectancy = (winRate/100 * (wins.reduce((a,b) => a+b.rMultiple,0)/wins.length || 0)) - 
                           ((1 - winRate/100) * (losses.reduce((a,b) => a+Math.abs(b.rMultiple),0)/losses.length || 1));

        let runningBalance = activeSession.initialBalance;
        const chartData = sessionTrades.map(t => {
            runningBalance += t.pnl;
            return { date: new Date(t.date).toLocaleDateString(), balance: runningBalance };
        });
        chartData.unshift({ date: 'Start', balance: activeSession.initialBalance });

        // R-Multiple Histogram Data
        const rBuckets: Record<string, number> = { '0-1R': 0, '1-2R': 0, '2-3R': 0, '3R+': 0, 'Loss': 0 };
        sessionTrades.forEach(t => {
            if (t.result === 'LOSS') rBuckets['Loss']++;
            else if (t.rMultiple < 1) rBuckets['0-1R']++;
            else if (t.rMultiple < 2) rBuckets['1-2R']++;
            else if (t.rMultiple < 3) rBuckets['2-3R']++;
            else rBuckets['3R+']++;
        });
        const rData = Object.entries(rBuckets).map(([name, value]) => ({ name, value }));

        return { totalPnl, winRate, avgR, expectancy, currentBalance: runningBalance, chartData, rData };
    }, [activeSession, sessionTrades]);

    const handleCreateSession = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSession: BacktestSession = {
            id: crypto.randomUUID(),
            name: formData.get('name') as string,
            symbol: formData.get('symbol') as string,
            initialBalance: Number(formData.get('balance')),
            strategy: formData.get('strategy') as string,
            timeframe: formData.get('timeframe') as string,
            createdAt: new Date().toISOString()
        };
        onAddSession(newSession);
        setIsAddingSession(false);
    };

    const handleCreateTrade = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSessionId) return;
        const formData = new FormData(e.currentTarget);
        const newTrade: BacktestTrade = {
            id: crypto.randomUUID(),
            sessionId: selectedSessionId,
            date: formData.get('date') as string,
            pnl: Number(formData.get('pnl')),
            rMultiple: Number(formData.get('r')),
            result: formData.get('result') as any,
            notes: formData.get('notes') as string
        };
        onAddTrade(newTrade);
        setIsAddingTrade(false);
    };

    if (!selectedSessionId) {
        return (
            <div className="p-8 max-w-[1400px] mx-auto space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Strategy Lab</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Backtesting Terminal v3.0</p>
                    </div>
                    <button 
                        onClick={() => setIsAddingSession(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-sm tracking-wider shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" /> Initialize New Lab
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map(session => (
                        <div 
                            key={session.id} 
                            onClick={() => setSelectedSessionId(session.id)}
                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                                    <Microscope className="h-8 w-8 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{session.name}</h3>
                                    <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase tracking-widest">{session.strategy}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Instrument</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-white">{session.symbol}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Timeframe</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-white">{session.timeframe}</p>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between items-center">
                                <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Enter Terminal →</span>
                                <div className="flex -space-x-2">
                                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700"></div>)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] opacity-30">
                            <ChartIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <p className="text-lg font-black text-slate-500 uppercase tracking-widest italic">Terminal Ready. Awaiting Initialization.</p>
                        </div>
                    )}
                </div>

                {isAddingSession && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                        <form onSubmit={handleCreateSession} className="bg-white dark:bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl">
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">New Backtest Lab</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure your testing environment</p>
                                </div>
                                <button type="button" onClick={() => setIsAddingSession(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><X className="h-6 w-6 text-slate-400" /></button>
                            </div>
                            <div className="p-10 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Lab Session Name</label>
                                            <input name="name" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. BTC Trend Reversals - Feb" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Trading Pair</label>
                                            <input name="symbol" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none" placeholder="BINANCE:BTCUSDT" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Initial Balance ($)</label>
                                            <input name="balance" type="number" required defaultValue="100000" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Timeframe (Default)</label>
                                            <select name="timeframe" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none">
                                                <option value="15">15 Minutes</option>
                                                <option value="60">1 Hour</option>
                                                <option value="240">4 Hours</option>
                                                <option value="D">Daily</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Strategy Filter</label>
                                            <input name="strategy" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold outline-none" placeholder="e.g. ICT Silver Bullet" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 bg-slate-50 dark:bg-slate-950/50 flex gap-4">
                                <button type="button" onClick={() => setIsAddingSession(false)} className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest">Abort</button>
                                <button type="submit" className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 uppercase tracking-widest">Initialize</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // Detail View with Simulation Terminal
    return (
        <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-slate-950">
            {/* Top Toolbar */}
            <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-6">
                    <button onClick={() => setSelectedSessionId(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{activeSession?.name}</h2>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <div className="flex gap-1">
                            {['1', '5', '15', '60', '240', 'D'].map(tf => (
                                <button 
                                    key={tf} 
                                    onClick={() => setActiveTimeframe(tf)}
                                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${activeTimeframe === tf ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-800'}`}
                                >
                                    {tf === 'D' ? 'D' : tf + 'm'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                        <button onClick={() => setViewMode('SIMULATE')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-lg transition-all ${viewMode === 'SIMULATE' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                            <Play className="h-3 w-3" /> Simulate
                        </button>
                        <button onClick={() => setViewMode('ANALYTICS')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-lg transition-all ${viewMode === 'ANALYTICS' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                            <BarChart3 className="h-3 w-3" /> Analytics
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsAddingTrade(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" /> Record Trade
                    </button>
                </div>
            </div>

            {/* Main Terminal Area */}
            <div className="flex-1 flex overflow-hidden">
                {viewMode === 'SIMULATE' ? (
                    <>
                        <div className="flex-1 bg-black relative">
                            <div id={`tv-backtest-${selectedSessionId}`} className="absolute inset-0"></div>
                        </div>
                        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
                            <div className="p-4 border-b border-slate-800 bg-slate-950/30">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Simulation Balance</h3>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-white italic tracking-tighter">${stats?.currentBalance.toLocaleString()}</h4>
                                    <p className={`text-[10px] font-bold ${stats!.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {stats!.totalPnl >= 0 ? '+' : '-'}${Math.abs(stats!.totalPnl).toLocaleString()} Lifetime P&L
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session History</h3>
                                {sessionTrades.length === 0 && <p className="text-[10px] text-slate-600 italic">No simulations logged yet.</p>}
                                {sessionTrades.map(trade => (
                                    <div key={trade.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl group relative">
                                        <button onClick={() => onDeleteTrade(trade.id)} className="absolute top-2 right-2 p-1 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="h-3 w-3" />
                                        </button>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{new Date(trade.date).toLocaleDateString()}</span>
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${trade.result === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {trade.result}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-black text-white">{trade.rMultiple}R Setup</p>
                                                {trade.notes && <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 italic">{trade.notes}</p>}
                                            </div>
                                            <p className={`text-sm font-black italic ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 custom-scrollbar">
                        <div className="max-w-6xl mx-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <AnalyticsStat label="Expectancy (R)" value={`${stats?.expectancy.toFixed(2)}R`} icon={Activity} info="Average R-Multiple per trade." />
                                <AnalyticsStat label="Win Rate" value={`${stats?.winRate.toFixed(1)}%`} icon={Target} info="Percentage of winning setups." />
                                <AnalyticsStat label="Avg R-Multiple" value={`${stats?.avgR.toFixed(2)}R`} icon={History} />
                                <AnalyticsStat label="Profit Factor" value={(Math.abs(sessionTrades.filter(t=>t.pnl>0).reduce((a,b)=>a+b.pnl,0)/(sessionTrades.filter(t=>t.pnl<=0).reduce((a,b)=>a+b.pnl,0)||1))).toFixed(2)} icon={TrendingUp} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Simulation Equity Progression</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats?.chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="date" hide />
                                                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#6366f1' }}
                                                />
                                                <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="lg:col-span-4 bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">R-Multiple Distribution</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats?.rData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                                                <YAxis stroke="#475569" fontSize={10} />
                                                <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.1)'}} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {stats?.rData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.name === 'Loss' ? '#f43f5e' : '#6366f1'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Trade Modal */}
            {isAddingTrade && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <form onSubmit={handleCreateTrade} className="bg-white dark:bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Record Sim Entry</h3>
                            <button type="button" onClick={() => setIsAddingTrade(false)} className="text-slate-400"><X className="h-6 w-6" /></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Outcome</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl">
                                        {(['WIN', 'LOSS', 'BE'] as const).map(res => (
                                            <button 
                                                key={res} type="button" 
                                                onClick={() => setViewMode(v => v)} // dummy to trigger re-render on native form usage
                                                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${res === 'WIN' ? 'hover:bg-emerald-500/20' : res === 'LOSS' ? 'hover:bg-rose-500/20' : 'hover:bg-slate-500/20'}`}
                                            >
                                                <input type="radio" name="result" value={res} className="hidden" defaultChecked={res === 'WIN'} />
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Date</label>
                                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Net P&L ($)</label>
                                    <input name="pnl" type="number" required placeholder="500" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">R-Multiple</label>
                                    <input name="r" type="number" step="0.1" required placeholder="2.0" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Sim Notes</label>
                                    <textarea name="notes" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white outline-none" placeholder="Fair Value Gap rejected perfectly..." rows={2} />
                                </div>
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50 dark:bg-slate-950/50 flex gap-4">
                            <button type="button" onClick={() => setIsAddingTrade(false)} className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                            <button type="submit" className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 uppercase tracking-widest">Commit</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

const AnalyticsStat = ({ label, value, icon: Icon, info }: any) => (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-indigo-500 transition-colors">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-white" />
            </div>
        </div>
        <h3 className="text-3xl font-black text-white italic tracking-tighter">{value}</h3>
        {info && (
            <div className="mt-2 text-[8px] font-bold text-slate-600 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {info}
            </div>
        )}
    </div>
);
