import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export const CalendarView: React.FC<{ trades: Trade[], currencySymbol: string }> = ({ trades, currencySymbol }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: Date, trades: Trade[], pnl: number } | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = useMemo(() => {
        const res = [];
        for (let i = 0; i < firstDay; i++) res.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toDateString();
            const dayTrades = trades.filter(t => new Date(t.entryDate).toDateString() === dateStr && t.status === 'CLOSED');
            
            const pairMap = new Map<string, number>();
            dayTrades.forEach(t => { pairMap.set(t.symbol, (pairMap.get(t.symbol) || 0) + t.pnl); });
            const pairSummaries = Array.from(pairMap.entries()).map(([symbol, pnl]) => ({ symbol, pnl }));
            const totalPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);

            res.push({ 
                date: i, 
                totalPnl, 
                hasTrades: dayTrades.length > 0, 
                trades: dayTrades,
                pairSummaries: pairSummaries.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
            });
        }
        return res;
    }, [currentDate, trades]);

    return (
        <div className="h-full flex flex-col space-y-4 overflow-hidden">
            <header className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Journal Calendar</h2>
                    <p className="text-slate-500 text-sm">Monthly Performance Heatmap.</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-800 text-slate-400"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest min-w-[100px] text-center">{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-800 text-slate-400"><ChevronRight className="h-4 w-4" /></button>
                </div>
            </header>

            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 bg-slate-950 border-b border-slate-800">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2 text-center text-[8px] font-black uppercase text-slate-600 tracking-widest">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 flex-1 min-h-0 auto-rows-fr">
                    {days.map((day, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => day?.hasTrades && setSelectedDay({ date: new Date(year, month, day.date), trades: day.trades, pnl: day.totalPnl })}
                            className={`border-r border-b border-slate-800/50 p-1 relative transition-all overflow-hidden ${day ? 'hover:bg-slate-800/40 cursor-pointer' : 'bg-slate-950/20'}`}
                        >
                            {day && (
                                <div className="h-full flex flex-col">
                                    <span className="text-[9px] font-black text-slate-600 mb-1">{day.date}</span>
                                    {day.hasTrades && (
                                        <div className="flex-1 flex flex-col justify-start space-y-0.5 overflow-hidden">
                                            {day.pairSummaries.slice(0, 3).map((ps, pi) => (
                                                <div key={pi} className={`flex justify-between items-center px-1 rounded-sm text-[8px] font-black leading-tight ${ps.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    <span className="truncate mr-1">{ps.symbol}</span>
                                                    <span>{ps.pnl >= 0 ? '+' : ''}{ps.pnl.toFixed(0)}</span>
                                                </div>
                                            ))}
                                            {day.pairSummaries.length > 3 && <div className="text-[7px] text-slate-500 text-center font-bold">+{day.pairSummaries.length - 3} more</div>}
                                        </div>
                                    )}
                                    {day.hasTrades && (
                                        <div className={`mt-auto pt-1 border-t border-slate-800/50 text-[10px] font-black text-center ${day.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {day.totalPnl >= 0 ? '+' : ''}{day.totalPnl.toFixed(0)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-xs font-black text-white uppercase italic tracking-widest">{selectedDay.date.toDateString()}</h3>
                            <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="p-6 space-y-3 max-h-[50vh] overflow-y-auto">
                            {selectedDay.trades.map(t => (
                                <div key={t.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                                    <span className="font-black text-white text-sm italic">{t.symbol}</span>
                                    <span className={`font-black text-sm italic ${t.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${t.pnl.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
