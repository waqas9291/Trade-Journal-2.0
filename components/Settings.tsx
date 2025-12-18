
import React, { useState } from 'react';
import { Account } from '../types';
import { Moon, Sun, Plus, Trash2, Save, Wallet, RefreshCw } from 'lucide-react';

// Updated interface to include data synchronization props
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

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
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
        </div>
    );
};
