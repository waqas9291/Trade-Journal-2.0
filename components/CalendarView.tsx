import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, X, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export const CalendarView: React.FC<{ trades: Trade[], currencySymbol: string }> = ({ trades, currencySymbol }) => {
    const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 1)); 
    const [selectedDayTrades, setSelectedDayTrades] = useState<{ date: string, trades: Trade[], pnl: number } | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendarData = useMemo(() => {
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const currentLoopDate = new Date(year, month, i);
            const dateStr = currentLoopDate.toDateString();
            const dayTrades = trades.filter(t => new Date(t.entryDate).toDateString() === dateStr && t.status === 'CLOSED');
            const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
            days.push({ 
                day: i, 
                dateStr: currentLoopDate.toLocaleDateString(undefined, { dateStyle: 'full' }),
                pnl, 
                trades: dayTrades, 
                hasTrades: dayTrades.length > 0 
            });
        }
        return days;
    }, [currentDate, trades]);

    const weeklyData = useMemo(() => {
        const weeks = [];
        const fullGrid = [...calendarData];
        while (fullGrid.length % 7 !== 0) fullGrid.push(null);

        for (let i = 0; i < fullGrid.length; i += 7) {
            const weekSlice = fullGrid.slice(i, i + 7);
            const weekPnl = weekSlice.reduce((sum, day) => sum + (day?.pnl || 0), 0);
            const activeDays = weekSlice.filter(day => day?.hasTrades).length;
            weeks.push({ pnl: weekPnl, days: activeDays });
        }
        return weeks;
    }, [calendarData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                        </button>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Today</span>
                        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Profit
                        <span className="w-2 h-2 rounded-full bg-rose-500 ml-2"></span> Loss
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-slate-50 dark:bg-slate-900 py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{d}</div>
                    ))}
                    {calendarData.map((day, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => day?.hasTrades && setSelectedDayTrades({ date: day.dateStr, trades: day.trades, pnl: day.pnl })}
                            className={`bg-white dark:bg-slate-950 h-24 p-1.5 relative border border-slate-50 dark:border-slate-900/50 transition-all ${day?.hasTrades ? 'cursor-pointer hover:shadow-xl hover:z-10 dark:hover:bg-slate-900' : ''}`}
                        >
                            {day && (
                                <>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 absolute top-2 right-2">{day.day}</span>
                                    {day.hasTrades && (
                                        <div className={`mt-3 w-full h-full rounded-lg p-2 flex flex-col items-center justify-center ${day.pnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20'}`}>
                                            <span className={`text-[11px] font-black ${day.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{day.trades.length} trade{day.trades.length > 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="w-24 space-y-px mt-[38px]">
                    {weeklyData.map((week, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-24 rounded-lg flex flex-col items-center justify-center text-center p-2 mb-px">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Week {idx + 1}</p>
                            <p className={`text-[10px] font-black mt-1 ${week.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {week.pnl >= 0 ? '+' : '-'}${Math.abs(week.pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400">{week.days} day{week.days !== 1 ? 's' : ''}</p>
                        </div>
                    ))}
                </div>
            </div>

            {selectedDayTrades && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{selectedDayTrades.date}</h3>
                                <p className={`text-xl font-black mt-1 ${selectedDayTrades.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {selectedDayTrades.pnl >= 0 ? '+' : '-'}${Math.abs(selectedDayTrades.pnl).toLocaleString()}
                                </p>
                            </div>
                            <button onClick={() => setSelectedDayTrades(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-3 custom-scrollbar">
                            {selectedDayTrades.trades.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${t.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {t.pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white italic">{t.symbol}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{t.direction} • {t.quantity} Lots</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black italic ${t.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${t.pnl.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(t.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
