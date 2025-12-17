import React, { useState } from 'react';
import { Calculator as CalculatorIcon, DollarSign, Percent, TrendingUp, RefreshCw } from 'lucide-react';

const PAIRS = [
    { name: 'EURUSD', pipValue: 10 },
    { name: 'GBPUSD', pipValue: 10 },
    { name: 'AUDUSD', pipValue: 10 },
    { name: 'NZDUSD', pipValue: 10 },
    { name: 'USDCAD', pipValue: 7.35 }, // Approx
    { name: 'USDCHF', pipValue: 11.1 }, // Approx
    { name: 'USDJPY', pipValue: 6.7 },  // Approx (1000 JPY / 150)
    { name: 'EURGBP', pipValue: 12.7 }, // Approx
    { name: 'EURJPY', pipValue: 6.7 },
    { name: 'GBPJPY', pipValue: 6.7 },
    { name: 'XAUUSD', pipValue: 10 },   // Standard (0.10 move = $10 on 100oz contract?) or $1. It depends. Usually 1 pip (0.10) is $10.
    { name: 'US30', pipValue: 1 },      // Varies widely
    { name: 'NAS100', pipValue: 1 },    // Varies widely
    { name: 'BTCUSD', pipValue: 1 },    // Varies widely
    { name: 'Custom', pipValue: 0 }
];

export const Calculator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'SIZE' | 'PNL'>('SIZE');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 border border-slate-200 dark:border-slate-700">
                    <CalculatorIcon className="h-10 w-10 text-gold-600 dark:text-gold-500" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Trading Calculator</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Calculate position sizes and potential profits.</p>
            </header>

            <div className="flex justify-center mb-6">
                <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 inline-flex">
                    <button
                        onClick={() => setActiveTab('SIZE')}
                        className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'SIZE' ? 'bg-gold-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Position Size
                    </button>
                    <button
                        onClick={() => setActiveTab('PNL')}
                        className={`px-6 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'PNL' ? 'bg-gold-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Profit / Loss
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden min-h-[400px]">
                {activeTab === 'SIZE' ? <PositionSizeCalculator /> : <PnLCalculator />}
            </div>
        </div>
    );
};

const PositionSizeCalculator = () => {
    const [balance, setBalance] = useState<number>(10000);
    const [riskPercent, setRiskPercent] = useState<number>(1);
    const [stopLoss, setStopLoss] = useState<number>(20);
    const [pipValue, setPipValue] = useState<number>(10); 
    const [instrument, setInstrument] = useState('EURUSD');

    const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = PAIRS.find(p => p.name === e.target.value);
        setInstrument(e.target.value);
        if(selected && selected.name !== 'Custom') {
            setPipValue(selected.pipValue);
        }
    };

    const riskAmount = (balance * riskPercent) / 100;
    // Formula: Lot = RiskAmount / (SL * PipValuePerLot)
    const standardLots = pipValue > 0 && stopLoss > 0 ? riskAmount / (stopLoss * pipValue) : 0;

    return (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Percent className="mr-2 h-5 w-5 text-gold-500" />
                    Risk Parameters
                </h3>
                
                <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Instrument</label>
                        <select 
                            value={instrument}
                            onChange={handleInstrumentChange}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        >
                            {PAIRS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Account Balance ($)</label>
                        <input 
                            type="number" 
                            value={balance} 
                            onChange={(e) => setBalance(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Risk (%)</label>
                            <input 
                                type="number" step="0.1"
                                value={riskPercent} 
                                onChange={(e) => setRiskPercent(Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Stop Loss (Pips)</label>
                            <input 
                                type="number" 
                                value={stopLoss} 
                                onChange={(e) => setStopLoss(Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pip Value ($/Lot)</label>
                        <div className="relative">
                            <input 
                                type="number" step="0.01"
                                value={pipValue} 
                                onChange={(e) => setPipValue(Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                            />
                             {instrument !== 'Custom' && (
                                 <p className="absolute right-3 top-3.5 text-xs text-slate-400 pointer-events-none">
                                     Auto-set for {instrument}
                                 </p>
                             )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 flex flex-col justify-center space-y-6 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Money at Risk</p>
                    <p className="text-3xl font-black text-rose-500 dark:text-rose-400 mt-1">${riskAmount.toFixed(2)}</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Standard Lots</span>
                        <span className="text-2xl font-bold text-gold-600 dark:text-gold-500">{standardLots.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Mini Lots</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{(standardLots * 10).toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Micro Lots</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">{(standardLots * 100).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

const PnLCalculator = () => {
    const [lots, setLots] = useState<number>(1.0);
    const [entryPrice, setEntryPrice] = useState<number>(1.0850);
    const [exitPrice, setExitPrice] = useState<number>(1.0900);
    const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
    const [pipValue, setPipValue] = useState<number>(10);
    const [instrument, setInstrument] = useState('EURUSD');

    const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = PAIRS.find(p => p.name === e.target.value);
        setInstrument(e.target.value);
        if(selected && selected.name !== 'Custom') {
            setPipValue(selected.pipValue);
        }
    };

    // Calc
    const diff = direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
    
    // Auto-detect JPY pair logic for pips
    const isJpyOrGold = entryPrice > 50; 
    const multiplier = isJpyOrGold ? 100 : 10000; 
    
    const pips = diff * multiplier; 
    const profit = pips * lots * pipValue;

    return (
         <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-gold-500" />
                    Trade Details
                </h3>

                <div className="flex bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-300 dark:border-slate-600 mb-4">
                    <button 
                        onClick={() => setDirection('BUY')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${direction === 'BUY' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >BUY / LONG</button>
                    <button 
                        onClick={() => setDirection('SELL')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${direction === 'SELL' ? 'bg-rose-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >SELL / SHORT</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Instrument</label>
                        <select 
                            value={instrument}
                            onChange={handleInstrumentChange}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        >
                            {PAIRS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Volume (Lots)</label>
                        <input 
                            type="number" step="0.01"
                            value={lots} 
                            onChange={(e) => setLots(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Entry Price</label>
                            <input 
                                type="number" step="0.00001"
                                value={entryPrice} 
                                onChange={(e) => setEntryPrice(Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Exit Price</label>
                            <input 
                                type="number" step="0.00001"
                                value={exitPrice} 
                                onChange={(e) => setExitPrice(Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pip Value ($/Lot)</label>
                        <input 
                            type="number" step="0.1"
                            value={pipValue} 
                            onChange={(e) => setPipValue(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        />
                    </div>
                </div>
            </div>

             <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 flex flex-col justify-center space-y-6 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimated P&L</p>
                    <p className={`text-4xl font-black mt-1 ${profit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                    </p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4 text-center">
                     <div className="flex justify-between items-center px-8">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Pips Gained/Lost</span>
                        <span className={`text-xl font-bold ${pips >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{pips.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">
                        *Estimation based on {isJpyOrGold ? 'JPY/Gold' : 'Standard'} pip scale.
                    </p>
                </div>
            </div>
        </div>
    )
}
