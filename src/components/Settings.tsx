import React, { useState } from 'react';
import { Account } from '../types';
import { Moon, Sun, Plus, Trash2, Save, Wallet, RefreshCw, Copy, Download, Upload } from 'lucide-react';

interface SettingsProps {
    accounts: Account[];
    onAddAccount: (account: Account) => void;
    onDeleteAccount: (id: string) => void;
    theme: 'dark' | 'light';
    toggleTheme: (theme: 'dark' | 'light') => void;
    onClearData: () => void;
    onExportString: () => string;
    onImportString: (data: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    accounts, 
    onAddAccount, 
    onDeleteAccount, 
    theme, 
    toggleTheme,
    onClearData,
    onExportString,
    onImportString
}) => {
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferMode, setTransferMode] = useState<'EXPORT' | 'IMPORT'>('EXPORT');
    const [transferData, setTransferData] = useState('');

    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAccountName || !newAccountBalance) return;

        const newAccount: Account = {
            id: crypto.randomUUID(),
            name: newAccountName,
            balance: Number(newAccountBalance),
            currency: newAccountCurrency
        };

        onAddAccount(newAccount);
        setNewAccountName('');
        setNewAccountBalance('');
    };

    const openExport = () => {
        const data = onExportString();
        setTransferData(data);
        setTransferMode('EXPORT');
        setShowTransferModal(true);
    };

    const openImport = () => {
        setTransferData('');
        setTransferMode('IMPORT');
        setShowTransferModal(true);
    };

    const handleImportSubmit = () => {
        if (!transferData) return;
        if (window.confirm("This will overwrite your current data with the imported data. Are you sure?")) {
            onImportString(transferData);
            setShowTransferModal(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(transferData);
        alert("Data code copied to clipboard!");
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-12">
            <header>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage your application preferences and accounts.</p>
            </header>

            {/* Appearance Section */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Appearance</h3>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => toggleTheme('light')}
                        className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Sun className="h-5 w-5 mr-2" />
                        Light Mode
                    </button>
                    <button 
                        onClick={() => toggleTheme('dark')}
                        className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-gold-500 bg-slate-700 text-gold-400' : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Moon className="h-5 w-5 mr-2" />
                        Dark Mode
                    </button>
                </div>
            </section>

             {/* Data Transfer Section (Manual Sync) */}
             <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Data Transfer</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Since this app runs locally, data doesn't sync automatically between devices.
                            Use this to transfer your data.
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={openExport}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                        <Copy className="h-5 w-5 mr-2" />
                        Get Sync Code (From PC)
                    </button>
                    <button 
                        onClick={openImport}
                        className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition-colors"
                    >
                        <Upload className="h-5 w-5 mr-2" />
                        Paste Sync Code (To Mobile)
                    </button>
                </div>
            </section>

            {/* Account Management */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Accounts</h3>
                </div>

                {/* Add Account Form */}
                <form onSubmit={handleCreateAccount} className="mb-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase mb-3 flex items-center">
                        <Plus className="h-4 w-4 mr-2" /> Add New Account
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                            type="text" 
                            placeholder="Account Name (e.g., Funded Acc)" 
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        />
                        <input 
                            type="number" 
                            placeholder="Initial Balance" 
                            value={newAccountBalance}
                            onChange={(e) => setNewAccountBalance(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        />
                         <select 
                            value={newAccountCurrency}
                            onChange={(e) => setNewAccountCurrency(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-gold-500 outline-none"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                        </select>
                    </div>
                    <button 
                        type="submit"
                        disabled={!newAccountName || !newAccountBalance}
                        className="mt-4 w-full md:w-auto px-6 py-2 bg-gold-600 hover:bg-gold-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Account
                    </button>
                </form>

                {/* Account List */}
                <div className="space-y-3">
                    {accounts.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center">
                                <div className="bg-gold-500/10 p-2 rounded-full mr-4">
                                    <Wallet className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{acc.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{acc.currency} {acc.balance.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                {accounts.length > 1 && (
                                    <button 
                                        onClick={() => onDeleteAccount(acc.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

             {/* Danger Zone */}
             <section className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/50 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-rose-600 mb-4">Danger Zone</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">Clear All Data</p>
                        <p className="text-sm text-slate-500">Permanently delete all trades and accounts. This action cannot be undone.</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to completely reset the app? All data will be lost.")) {
                                onClearData();
                            }
                        }}
                        className="px-4 py-2 border border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors font-medium"
                    >
                        Reset Application
                    </button>
                </div>
            </section>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {transferMode === 'EXPORT' ? 'Get Sync Code' : 'Paste Sync Code'}
                            </h3>
                            <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {transferMode === 'EXPORT' 
                                    ? "Copy this code and paste it into the 'Paste Sync Code' box on your other device." 
                                    : "Paste the code you copied from your other device here."}
                            </p>
                            
                            <textarea 
                                className="w-full h-48 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-white focus:border-gold-500 outline-none resize-none"
                                value={transferData}
                                onChange={(e) => setTransferData(e.target.value)}
                                readOnly={transferMode === 'EXPORT'}
                                placeholder={transferMode === 'IMPORT' ? "Paste code here..." : ""}
                            />

                            <div className="flex gap-3">
                                {transferMode === 'EXPORT' ? (
                                    <button 
                                        onClick={copyToClipboard}
                                        className="flex-1 py-3 bg-gold-600 text-white font-bold rounded-lg hover:bg-gold-500 transition-colors"
                                    >
                                        Copy Code
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleImportSubmit}
                                        disabled={!transferData}
                                        className="flex-1 py-3 bg-gold-600 text-white font-bold rounded-lg hover:bg-gold-500 transition-colors disabled:opacity-50"
                                    >
                                        Import Data
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
