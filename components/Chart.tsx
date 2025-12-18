import React, { useEffect, useRef, useState } from 'react';
import { Bell, Plus, X, Trash2, ShieldAlert, Crosshair } from 'lucide-react';
import { PriceAlert } from '../types';
import { loadAlerts, saveAlerts } from '../services/storage';

export const Chart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertSymbol, setNewAlertSymbol] = useState('FX:EURUSD');

  useEffect(() => {
    setAlerts(loadAlerts());
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script')) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": newAlertSymbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "save_image": true,
      "hide_side_toolbar": false,
      "studies": ["STD;MACD", "STD;RSI"]
    });
    containerRef.current.appendChild(script);
  }, [newAlertSymbol]);

  const addAlert = () => {
    if (!newAlertPrice) return;
    const alert: PriceAlert = {
      id: crypto.randomUUID(),
      symbol: newAlertSymbol,
      price: Number(newAlertPrice),
      condition: 'ABOVE', // Simplified for demo
      active: true,
      createdAt: new Date().toISOString()
    };
    setAlerts([...alerts, alert]);
    setNewAlertPrice('');
    
    // Simulate Notification
    if (Notification.permission === 'granted') {
      new Notification('MR Wick Alert Set', {
        body: `Monitoring ${newAlertSymbol} for price ${newAlertPrice}`,
        icon: '/vite.svg'
      });
    }
  };

  return (
    <div className="h-full flex flex-col h-[calc(100vh-100px)] relative">
        <header className="mb-4 flex justify-between items-center">
             <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Live Terminal</h2>
                <p className="text-slate-500 dark:text-slate-400">TradingView Precision Analysis</p>
             </div>
             <button 
                onClick={() => setIsAlertPanelOpen(!isAlertPanelOpen)}
                className={`p-3 rounded-2xl transition-all flex items-center gap-2 font-bold text-xs uppercase ${isAlertPanelOpen ? 'bg-gold-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-gold-500'}`}
             >
                <Bell className={`h-4 w-4 ${alerts.some(a => a.active) ? 'animate-bounce' : ''}`} />
                {alerts.filter(a => a.active).length} Active Alerts
             </button>
        </header>

        <div className="flex-1 flex gap-4 overflow-hidden">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative" ref={containerRef}>
                {/* TradingView Widget */}
            </div>

            {isAlertPanelOpen && (
                <div className="w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase italic text-sm tracking-widest">Price Alerts</h3>
                        <button onClick={() => setIsAlertPanelOpen(false)} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <input 
                            type="text"
                            placeholder="Symbol (e.g. FX:EURUSD)"
                            value={newAlertSymbol}
                            onChange={e => setNewAlertSymbol(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-mono"
                        />
                        <div className="flex gap-2">
                             <input 
                                type="number"
                                placeholder="Target Price"
                                value={newAlertPrice}
                                onChange={e => setNewAlertPrice(e.target.value)}
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold"
                            />
                            <button onClick={addAlert} className="bg-gold-500 text-slate-900 p-3 rounded-xl hover:bg-gold-400">
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {alerts.map(a => (
                            <div key={a.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-2xl group transition-all hover:border-gold-500/50">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest">{a.symbol}</span>
                                    <button onClick={() => setAlerts(alerts.filter(al => al.id !== a.id))} className="text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xl font-black text-white tracking-tighter italic">{a.price}</span>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">{a.active ? 'Monitoring' : 'Triggered'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};