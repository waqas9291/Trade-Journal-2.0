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
      "interval": "D",
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
      "studies": ["STD;MACD", "STD;RSI"],
      "show_popup_button": true,
      "popup_width": "1000",
      "popup_height": "650",
      "container_id": "tradingview_wick"
    });
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
        <header className="mb-4 shrink-0">
             <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Live Terminal</h2>
             <p className="text-slate-500">TradingView Precision Analysis</p>
        </header>
        <div id="tradingview_wick" className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative" ref={containerRef}>
            {/* Widget Injected Here */}
        </div>
    </div>
  );
};
