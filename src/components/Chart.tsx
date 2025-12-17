import React, { useEffect, useRef } from 'react';

export const Chart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Check if script already exists to prevent duplication on re-renders
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
      "theme": document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "save_image": true,
      "hide_side_toolbar": false,
      // Enables local storage of drawings/indicators
      "studies": [
        "STD;MACD",
        "STD;RSI"
      ]
    });
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="h-full flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-40px)]">
        <header className="mb-4 flex-shrink-0">
             <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Chart</h2>
             <p className="text-slate-500 dark:text-slate-400">Real-time analysis powered by TradingView.</p>
        </header>
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm" ref={containerRef}>
            {/* Widget is injected here */}
        </div>
    </div>
  );
};
