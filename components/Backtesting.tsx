import React, { useState, useMemo } from 'react';
import { BacktestSession, BacktestTrade } from '../types';
import { Plus, Microscope, Trash2, LineChart as ChartIcon, History, TrendingUp, Target, Save, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

    const activeSession = useMemo(() => 
        sessions.find(s => s.id === selectedSessionId), 
    [sessions, selectedSessionId]);

    const sessionTrades = useMemo(() => 
        trades.filter(t => t.sessionId === selectedSessionId)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [trades, selectedSessionId]);

    const sessionStats = useMemo(() => {
        if (!activeSession) return null;
        const totalPnl = sessionTrades.reduce((acc, t) => acc + t.pnl, 0);
        const wins = sessionTrades.filter(t => t.result === 'WIN').length;
        const winRate = sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0;
        const avgR = sessionTrades.length > 0 ? sessionTrades.reduce((acc, t) => acc + t.rMultiple, 0) / sessionTrades.length : 0;

        let runningBalance = activeSession.initialBalance;
        const chartData = sessionTrades.map(t => {
            runningBalance += t.pnl;
            return { date: new Date(t.date).toLocaleDateString(), balance: runningBalance };
        });

        // Insert starting point
        chartData.unshift({ date: 'Start', balance: activeSession.initialBalance });

        return { totalPnl, winRate, avgR, count: sessionTrades.length, currentBalance: runningBalance, chartData };
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

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {!selectedSessionId ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <header className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Strategy Lab</h2>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mt-1">Isolate and test your edge</p>
                        </div>
                        <button 
                            onClick={() => setIsAddingSession(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" /> New Session
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(session => (
                            <div 
                                key={session.id} 
                                onClick={() => setSelectedSessionId(session.id)}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        <Microscope className="h-6 w-6 text-indigo-500 group-hover:text-white" />
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{session.name}</h3>
                                <div className="mt-2 space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{session.symbol} • {session.timeframe} • {session.strategy}</p>
                                    <p className="text-[10px] font-bold text-slate-500">Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs font-bold text-indigo-500">View Data →</span>
                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 uppercase tracking-widest">
                                        {trades.filter(t => t.sessionId === session.id).length} Simulated Trades
                                    </span>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl opacity-50">
                                <Microscope className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No backtest sessions found. Create your first lab.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <header className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedSessionId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">{activeSession?.name}</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">{activeSession?.symbol} • {activeSession?.strategy}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsAddingTrade(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" /> Log Result
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Total P&L" value={`$${sessionStats?.totalPnl.toLocaleString()}`} positive={sessionStats!.totalPnl >= 0} icon={TrendingUp} />
                        <StatCard label="Win Rate" value={`${sessionStats?.winRate.toFixed(1)}%`} icon={Target} />
                        <StatCard label="Avg. R-Multiple" value={`${sessionStats?.avgR.toFixed(2)}R`} icon={History} />
                        <StatCard label="Current Sim Balance" value={`$${sessionStats?.currentBalance.toLocaleString()}`} icon={Microscope} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Equity Curve Simulation</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={sessionStats?.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis stroke="#999" fontSize={10} domain={['auto', 'auto']} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Log History</h3>
                                <span className="text-[10px] font-bold text-slate-500">{sessionTrades.length} Trades</span>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                                {sessionTrades.map(trade => (
                                    <div key={trade.id} className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white italic">{new Date(trade.date).toLocaleDateString()}</p>
                                            <p className={`text-[10px] font-bold ${trade.result === 'WIN' ? 'text-emerald-500' : trade.result === 'LOSS' ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {trade.result} • {trade.rMultiple}R
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-black italic ${trade.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                                            </span>
                                            <button onClick={() => onDeleteTrade(trade.id)} className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {isAddingSession && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleCreateSession} className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">New Simulation Session</h3>
                            <button type="button" onClick={() => setIsAddingSession(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Session Name</label>
                                    <input name="name" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="ICT Silver Bullet Trial" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Symbol</label>
                                    <input name="symbol" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="EURUSD" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Starting Balance</label>
                                    <input name="balance" type="number" required defaultValue="100000" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Timeframe</label>
                                    <input name="timeframe" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="15m" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Strategy</label>
                                    <input name="strategy" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Fair Value Gap" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex gap-3">
                            <button type="button" onClick={() => setIsAddingSession(false)} className="flex-1 py-3 text-xs font-bold text-slate-400">Cancel</button>
                            <button type="submit" className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20">Initialize Session</button>
                        </div>
                    </form>
                </div>
            )}

            {isAddingTrade && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleCreateTrade} className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Record Sim Result</h3>
                            <button type="button" onClick={() => setIsAddingTrade(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Result</label>
                                    <select name="result" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none">
                                        <option value="WIN">WIN</option>
                                        <option value="LOSS">LOSS</option>
                                        <option value="BE">BE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Date</label>
                                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">P&L ($)</label>
                                    <input name="pnl" type="number" required defaultValue="500" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">R-Multiple</label>
                                    <input name="r" type="number" step="0.1" required defaultValue="2.0" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Notes</label>
                                    <textarea name="notes" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none" placeholder="Missed liquidity sweep..." />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex gap-3">
                            <button type="button" onClick={() => setIsAddingTrade(false)} className="flex-1 py-3 text-xs font-bold text-slate-400">Cancel</button>
                            <button type="submit" className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20">Commit Trade</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, positive, icon: Icon }: any) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800`}>
                <Icon className={`h-4 w-4 ${positive === false ? 'text-rose-500' : 'text-indigo-500'}`} />
            </div>
        </div>
        <h3 className={`text-2xl font-black italic tracking-tighter ${positive === false ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{value}</h3>
    </div>
);

const ChevronLeft = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
