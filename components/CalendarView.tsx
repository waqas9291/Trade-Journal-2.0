
import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react';

// Updated interface to include currencySymbol
interface CalendarViewProps {
    trades: Trade[];
    currencySymbol: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ trades, currencySymbol }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ date: Date, trades: Trade[], pnl: number } | null>(null);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toDateString();
            const dayTrades = trades.filter(t => new Date(t.entryDate).toDateString() === dateStr && t.status === 'CLOSED');
            const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
            // Get symbol with most impact or volume
            const topSymbol = dayTrades.length > 0 ? dayTrades.sort((a,b) => Math.abs(b.pnl) - Math.abs(a.pnl))[0].symbol : '';
            
            days.push({
                date: i,
                pnl: dayPnl,
                tradeCount: dayTrades.length,
                hasTrades: dayTrades.length > 0,
                topSymbol,
                trades: dayTrades
            });
        }

        return days;
    }, [currentDate, trades]);

    const handleDayClick = (day: any) => {
        if (day && day.hasTrades) {
            setSelectedDay({
                date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date),
                trades: day.trades,
                pnl: day.pnl
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Calendar</h2>
                    <p className="text-slate-500 dark:text-slate-400">Monthly P&L Overview</p>
                </div>
                <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-lg font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 bg-white dark:bg-slate-800">
                    {calendarData.map((day, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleDayClick(day)}
                            className={`
                                aspect-square border-r border-b border-slate-100 dark:border-slate-700/50 p-2 relative transition-all duration-200
                                ${day ? 'hover:bg-slate-50 dark:hover:bg-slate-700/20' : 'bg-slate-50/30 dark:bg-slate-800/30'}
                                ${day?.hasTrades ? 'cursor-pointer' : ''}
                            `}
                        >
                            {day && (
                                <div className="h-full flex flex-col items-center justify-between py-1">
                                    <span className={`text-xs font-medium ${day.hasTrades ? 'text-slate-400 dark:text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                        {day.date}
                                    </span>
                                    
                                    {day.hasTrades ? (
                                        <div className={`
                                            flex-1 w-full flex flex-col justify-center items-center rounded-lg mx-1 my-1
                                            ${day.pnl >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}
                                        `}>
                                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-0.5">{day.topSymbol}</span>
                                            <div className={`text-sm font-bold ${day.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {day.pnl >= 0 ? '+' : '-'}{Math.abs(day.pnl).toFixed(0)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1"></div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Day Details Modal */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        
                        {/* Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                                    {selectedDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <p className={`text-sm font-medium mt-1 ${selectedDay.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    Daily Net: {selectedDay.pnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(selectedDay.pnl).toFixed(2)}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedDay(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto p-4 space-y-3">
                            {selectedDay.trades.sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()).map(trade => (
                                <div key={trade.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${trade.pnl >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                            {trade.pnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">{trade.symbol}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.direction === 'LONG' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                                                    {trade.direction}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {new Date(trade.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {trade.quantity} Lots
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                                        <span className={`text-lg font-bold ${trade.pnl >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                            {trade.pnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(trade.pnl).toFixed(2)}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {trade.exitPrice ? 'Closed' : 'Open'}
                                        </span>
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
