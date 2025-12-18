import React, { useState } from 'react';
import { Calculator as CalculatorIcon, DollarSign, Percent, TrendingUp, RefreshCw } from 'lucide-react';

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
    const [pipValue, setPipValue] = useState<number>(10); // Default $10 for Standard Lot
    const [instrument, setInstrument] = useState('EURUSD');

    const riskAmount = (balance * riskPercent) / 100;
    // Formula: Lot = RiskAmount / (SL * PipValuePerLot)
    // Note: PipValue is usually per Standard Lot (100k units)
    const standardLots = riskAmount / (stopLoss * pipValue);

    return (
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Percent className="mr-2 h-5 w-5 text-gold-500" />
                    Risk Parameters
                </h3>
                
                <div className="space-y-4">
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
                                type="number" step="0.1"
                                value={pipValue} 
                                onChange={(e) => setPipValue(Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                            />
                             <p className="absolute right-3 top-3.5 text-xs text-slate-400 pointer-events-none">Default: $10 (EURUSD)</p>
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

    // Calc
    const diff = direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
    // Assuming Standard Lot (100k) and normal pairs where 0.0001 is a pip.
    // However, simplest general way: (Diff / PointSize) * PipValue * Lots.
    // Let's assume input is raw price.
    // We'll estimate pips by raw difference * 10000 (for non-JPY).
    // Better: Just use (Diff * Lots * ContractSize) ?? No, let's stick to Pip Value method.
    
    // Auto-detect JPY pair logic could go here, but keep it simple:
    const multiplier = entryPrice > 50 ? 100 : 10000; // Rough guess: if price > 50 it's likely JPY (e.g. 145.00) or Gold (2000), else e.g. 1.0500
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
                        *Estimation based on {entryPrice > 50 ? 'JPY/Gold' : 'Standard'} pip scale.
                    </p>
                </div>
            </div>
        </div>
    )
}