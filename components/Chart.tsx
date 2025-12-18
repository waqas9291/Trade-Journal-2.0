import React, { useEffect, useRef } from 'react';

export const Chart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (containerRef.current.querySelector('script')) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": "FX:EURUSD",
      "interval": "15",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "save_image": true,
      "hide_side_toolbar": false,
      "withdateranges": true,
      "details": true,
      "hotlist": true,
      "studies": [
        "STD;MACD",
        "STD;RSI",
        "STD;EMA;20",
        "STD;EMA;50"
      ],
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "container_id": "tradingview_terminal_wick"
    });
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-4">
        <header className="shrink-0 flex justify-between items-end">
             <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Market Terminal</h2>
                <p className="text-slate-500 text-xs italic mt-1 uppercase tracking-widest font-bold">TradingView Advanced Integration</p>
             </div>
             <div className="hidden sm:block text-[10px] font-black uppercase text-gold-500 bg-gold-500/10 px-3 py-1 rounded-lg border border-gold-500/20">
                Precision Execution Ready
             </div>
        </header>
        <div id="tradingview_terminal_wick" className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative min-h-0" ref={containerRef}>
            {/* Widget Injected Here */}
        </div>
    </div>
  );
};
