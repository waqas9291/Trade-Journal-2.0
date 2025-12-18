import React, { useState, useMemo } from 'react';
import { Calculator as CalculatorIcon, DollarSign, Percent, Crosshair, Search } from 'lucide-react';

const INSTRUMENTS = [
  { symbol: 'EURUSD', pipValue: 10, type: 'FX' },
  { symbol: 'GBPUSD', pipValue: 10, type: 'FX' },
  { symbol: 'XAUUSD', pipValue: 10, type: 'GOLD' },
  { symbol: 'US30', pipValue: 1, type: 'INDEX' },
  { symbol: 'NAS100', pipValue: 1, type: 'INDEX' },
  { symbol: 'BTCUSD', pipValue: 1, type: 'CRYPTO' },
  { symbol: 'USDJPY', pipValue: 6.7, type: 'FX' },
];

export const Calculator: React.FC<{ balance: number }> = ({ balance }) => {
  const [calcBalance, setCalcBalance] = useState(balance);
  const [riskPct, setRiskPct] = useState(1);
  const [stopLoss, setStopLoss] = useState(20);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(INSTRUMENTS[0]);

  const filtered = useMemo(() => 
    INSTRUMENTS.filter(i => i.symbol.toLowerCase().includes(search.toLowerCase()))
  , [search]);

  const riskAmount = (calcBalance * riskPct) / 100;
  const lotSize = riskAmount / (stopLoss * selected.pipValue);

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Terminal Calcs</h2>
          <p className="text-slate-500 text-sm">Institutional precision position sizing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Search Instrument</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
                <input 
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-white outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="XAUUSD, NAS100..."
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {filtered.slice(0, 5).map(i => (
                  <button 
                    key={i.symbol} onClick={() => setSelected(i)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selected.symbol === i.symbol ? 'bg-gold-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    {i.symbol}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="col-span-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Account Balance</label>
               <div className="flex gap-2">
                 <input 
                    type="number" value={calcBalance} onChange={e => setCalcBalance(Number(e.target.value))}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black"
                 />
                 <button onClick={() => setCalcBalance(balance)} className="bg-slate-800 px-4 rounded-xl text-xs font-bold text-gold-500">Live</button>
               </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Risk %</label>
              <input 
                type="number" value={riskPct} onChange={e => setRiskPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Stop Loss (Pips)</label>
              <input 
                type="number" value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-black"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-center items-center bg-slate-950 rounded-3xl p-8 border border-slate-800 space-y-8">
           <div className="text-center">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Capital At Risk</p>
             <h3 className="text-4xl font-black text-rose-500 italic mt-2">${riskAmount.toLocaleString()}</h3>
           </div>
           <div className="w-full space-y-2">
             <div className="flex justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800">
               <span className="text-xs font-bold text-slate-400 uppercase">Standard Lots</span>
               <span className="text-xl font-black text-gold-500 italic">{lotSize.toFixed(2)}</span>
             </div>
             <div className="flex justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800">
               <span className="text-xs font-bold text-slate-400 uppercase">Instrument Data</span>
               <span className="text-xs font-black text-white italic">{selected.symbol} (pip=${selected.pipValue})</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
