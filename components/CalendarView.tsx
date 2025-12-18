import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

export const CalendarView: React.FC<{ trades: Trade[], currencySymbol: string }> = ({ trades, currencySymbol }) => {
    const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 1)); // Mocked to June 2024 per screenshot

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendarData = useMemo(() => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) days.push(null);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toDateString();
            const dayTrades = trades.filter(t => new Date(t.entryDate).toDateString() === dateStr && t.status === 'CLOSED');
            const pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
            days.push({ day: i, pnl, trades: dayTrades.length, hasTrades: dayTrades.length > 0 });
        }
        return days;
    }, [currentDate, trades]);

    // Calculate Weekly Data based on calendar grid rows
    const weeklyData = useMemo(() => {
        const weeks = [];
        const fullGrid = [...calendarData];
        
        // Ensure we have a multiple of 7 to process full rows
        while (fullGrid.length % 7 !== 0) {
            fullGrid.push(null);
        }

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
                        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 rounded-md">
                            <ChevronLeft className="h-4 w-4 text-slate-400" />
                        </button>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Today</span>
                        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 rounded-md">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                    <span className="text-lg font-black text-slate-900 tracking-tight">
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
                <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="bg-slate-50 py-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{d}</div>
                    ))}
                    {calendarData.map((day, idx) => (
                        <div key={idx} className={`bg-white h-24 p-1.5 relative border border-slate-50 transition-all ${day?.hasTrades ? 'cursor-pointer hover:shadow-xl hover:z-10' : ''}`}>
                            {day && (
                                <>
                                    <span className="text-[10px] font-bold text-slate-400 absolute top-2 right-2">{day.day}</span>
                                    {day.hasTrades && (
                                        <div className={`mt-3 w-full h-full rounded-lg p-2 flex flex-col items-center justify-center ${day.pnl >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                                            <span className={`text-[11px] font-black ${day.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-500 mt-0.5">{day.trades} trade{day.trades > 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Weekly Column Summary */}
                <div className="w-24 space-y-px mt-[38px]">
                    {weeklyData.map((week, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 h-24 rounded-lg flex flex-col items-center justify-center text-center p-2 mb-px">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Week {idx + 1}</p>
                            <p className={`text-[10px] font-black mt-1 ${week.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {week.pnl >= 0 ? '+' : '-'}${Math.abs(week.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400">{week.days} day{week.days !== 1 ? 's' : ''}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
