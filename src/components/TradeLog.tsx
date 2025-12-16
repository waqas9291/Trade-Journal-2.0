import React, { useState } from 'react';
import { Trade, Account } from '../types';
import { Plus, Trash2, Edit2, Search, Filter, ChevronDown, ChevronUp, Target, Shield, Clock, FileText, Hash } from 'lucide-react';

interface TradeLogProps {
    trades: Trade[];
    accounts: Account[];
    onAddTrade: (trade: Trade) => void;
    onDeleteTrade: (id: string) => void;
    onUpdateTrade: (trade: Trade) => void;
}

export const TradeLog: React.FC<TradeLogProps> = ({ trades, accounts, onAddTrade, onDeleteTrade, onUpdateTrade }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Trade>>({
        symbol: '',
        direction: 'LONG',
        entryDate: new Date().toISOString().slice(0, 16),
        status: 'OPEN',
        pnl: 0,
        entryPrice: 0,
        exitPrice: 0,
        quantity: 0.01,
        sl: 0,
        tp: 0
    });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.symbol || !formData.entryPrice) return;

        const tradeData: Trade = {
            id: editingTrade ? editingTrade.id : crypto.randomUUID(),
            accountId: formData.accountId || accounts[0]?.id || '1',
            symbol: formData.symbol!.toUpperCase(),
            direction: formData.direction as 'LONG' | 'SHORT',
            entryDate: formData.entryDate!,
            entryPrice: Number(formData.entryPrice),
            quantity: Number(formData.quantity), // Lot Size
            pnl: Number(formData.pnl),
            status: formData.status as 'OPEN' | 'CLOSED' | 'PENDING',
            notes: formData.notes,
            setup: formData.setup,
            exitDate: formData.exitDate,
            exitPrice: formData.exitPrice ? Number(formData.exitPrice) : undefined,
            sl: Number(formData.sl),
            tp: Number(formData.tp),
            fees: formData.fees ? Number(formData.fees) : 0
        };

        if (editingTrade) {
            onUpdateTrade(tradeData);
        } else {
            onAddTrade(tradeData);
        }
        
        closeForm();
    };

    const openEdit = (e: React.MouseEvent, trade: Trade) => {
        e.stopPropagation();
        setEditingTrade(trade);
        setFormData(trade);
        setIsFormOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(window.confirm('Are you sure you want to delete this trade?')) {
            onDeleteTrade(id);
        }
    };

    const toggleRow = (id: string) => {
        setExpandedTradeId(expandedTradeId === id ? null : id);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingTrade(null);
        setFormData({
            symbol: '',
            direction: 'LONG',
            entryDate: new Date().toISOString().slice(0, 16),
            status: 'OPEN',
            pnl: 0,
            entryPrice: 0,
            exitPrice: 0,
            quantity: 0.01,
            sl: 0,
            tp: 0
        });
    };

    const filteredTrades = trades.filter(t => 
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.setup?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">History</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your complete trade logs.</p>
                </div>
                <button 
                    onClick={() => setIsFormOpen(true)}
                    className="bg-gold-600 hover:bg-gold-500 text-white px-4 py-2 rounded-lg flex items-center transition-colors font-medium shadow-lg shadow-gold-500/20 w-full md:w-auto justify-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Log Trade
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search by symbol or setup..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-200 w-full placeholder-slate-400 outline-none"
                />
                <Filter className="h-5 w-5 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300" />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Symbol</th>
                                <th className="px-6 py-4">Side</th>
                                <th className="px-6 py-4">Lots</th>
                                <th className="px-6 py-4">Price In</th>
                                <th className="px-6 py-4">Price Out</th>
                                <th className="px-6 py-4">P&L</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                            {filteredTrades.map((trade) => (
                                <React.Fragment key={trade.id}>
                                    <tr 
                                        onClick={() => toggleRow(trade.id)}
                                        className={`cursor-pointer transition-colors ${expandedTradeId === trade.id ? 'bg-slate-50 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(trade.entryDate).toLocaleDateString()} <span className="text-slate-400 dark:text-slate-600 text-xs">{new Date(trade.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            {trade.symbol}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                                trade.direction === 'LONG' ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-400/10' : 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-400/10'
                                            }`}>
                                                {trade.direction}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {trade.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {trade.entryPrice}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                            {trade.exitPrice || '-'}
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${trade.pnl >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                            ${trade.pnl.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end space-x-3">
                                            <button onClick={(e) => openEdit(e, trade)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, trade.id)} className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <div className="text-slate-400">
                                                {expandedTradeId === trade.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedTradeId === trade.id && (
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <td colSpan={8} className="px-6 py-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                                                    
                                                    {/* Column 1: Specifics */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                                            <Target className="h-3 w-3 mr-1" /> Targets & Risk
                                                        </h4>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Stop Loss:</span>
                                                            <span className="text-slate-900 dark:text-white font-medium">{trade.sl !== undefined && trade.sl !== 0 ? trade.sl : 'None'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Take Profit:</span>
                                                            <span className="text-slate-900 dark:text-white font-medium">{trade.tp !== undefined && trade.tp !== 0 ? trade.tp : 'None'}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Fees/Swap:</span>
                                                            <span className="text-rose-500 font-medium">${(trade.fees || 0).toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Column 2: Info & Time */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                                            <Hash className="h-3 w-3 mr-1" /> Trade Info
                                                        </h4>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Ticket ID:</span>
                                                            <span className="text-slate-900 dark:text-slate-200 font-mono text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{trade.id}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Exit Time:</span>
                                                            <span className="text-slate-900 dark:text-slate-200 text-xs text-right">
                                                                {trade.exitDate ? new Date(trade.exitDate).toLocaleString() : 'Active'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Column 3: Notes */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                                            <FileText className="h-3 w-3 mr-1" /> Analysis
                                                        </h4>
                                                        {trade.setup && (
                                                            <div className="text-sm">
                                                                <span className="text-slate-500 dark:text-slate-400 block text-xs">Setup:</span>
                                                                <span className="text-slate-900 dark:text-white">{trade.setup}</span>
                                                            </div>
                                                        )}
                                                        <div className="text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400 block text-xs">Notes:</span>
                                                            <p className="text-slate-900 dark:text-white italic text-xs mt-1 leading-relaxed opacity-80">
                                                                {trade.notes || "No notes added."}
                                                            </p>
                                                        </div>
                                                        <div className="pt-2">
                                                             <button 
                                                                onClick={(e) => handleDelete(e, trade.id)} 
                                                                className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center"
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" /> Delete from History
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filteredTrades.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        No trades found. Start by logging a new trade!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingTrade ? 'Edit Trade' : 'Log New Trade'}
                            </h3>
                            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Account</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                                        value={formData.accountId}
                                        onChange={e => setFormData({...formData, accountId: e.target.value})}
                                    >
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Symbol</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white uppercase focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
                                        value={formData.symbol}
                                        onChange={e => setFormData({...formData, symbol: e.target.value})}
                                        required
                                        placeholder="XAUUSD"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Direction</label>
                                    <div className="flex bg-slate-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-300 dark:border-slate-600">
                                        <button 
                                            type="button"
                                            className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${formData.direction === 'LONG' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            onClick={() => setFormData({...formData, direction: 'LONG'})}
                                        >LONG</button>
                                        <button 
                                            type="button"
                                            className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${formData.direction === 'SHORT' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            onClick={() => setFormData({...formData, direction: 'SHORT'})}
                                        >SHORT</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                                    >
                                        <option value="OPEN">OPEN</option>
                                        <option value="CLOSED">CLOSED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lot Size</label>
                                    <input 
                                        type="number" step="0.01"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.quantity}
                                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Entry Price</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.entryPrice}
                                        onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Exit Price</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.exitPrice}
                                        onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            {/* Targets */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Stop Loss</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.sl}
                                        onChange={e => setFormData({...formData, sl: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Take Profit</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.tp}
                                        onChange={e => setFormData({...formData, tp: Number(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fees ($)</label>
                                    <input 
                                        type="number" step="0.01"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.fees || 0}
                                        onChange={e => setFormData({...formData, fees: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Entry Date</label>
                                    <input 
                                        type="datetime-local"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                        value={formData.entryDate}
                                        onChange={e => setFormData({...formData, entryDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">P&L ($)</label>
                                    <input 
                                        type="number" step="0.01"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 font-bold focus:border-gold-500 outline-none ${Number(formData.pnl) >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}
                                        value={formData.pnl}
                                        onChange={e => setFormData({...formData, pnl: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            
                             <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Setup / Strategy</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                                    value={formData.setup || ''}
                                    onChange={e => setFormData({...formData, setup: e.target.value})}
                                    placeholder="e.g. Breakout, Reversal..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white h-24 focus:border-gold-500 outline-none"
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Why did you take this trade?"
                                />
                            </div>

                            <div className="pt-4 flex space-x-3">
                                <button 
                                    type="button" 
                                    onClick={closeForm}
                                    className="flex-1 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 rounded-lg bg-gold-600 text-white font-bold hover:bg-gold-500 transition-colors shadow-lg shadow-gold-600/20"
                                >
                                    Save Trade
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
