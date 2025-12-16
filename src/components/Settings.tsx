import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { Moon, Sun, Plus, Trash2, Wallet, Copy, Download, Upload, Cloud, Check } from 'lucide-react';
import { getCloudConfig, saveCloudConfig, uploadToCloud, downloadFromCloud } from '../services/cloud';

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

    // Cloud Settings
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [syncId, setSyncId] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const config = getCloudConfig();
        setSupabaseUrl(config.url);
        setSupabaseKey(config.key);
        setSyncId(config.syncId);
    }, []);

    const handleSaveCloudConfig = () => {
        saveCloudConfig(supabaseUrl, supabaseKey, syncId);
        alert("Cloud configuration saved locally!");
    };

    const handleCloudUpload = async () => {
        if (!supabaseUrl || !supabaseKey || !syncId) {
            alert("Please configure Cloud Settings first.");
            return;
        }
        setIsSyncing(true);
        try {
            // We need to parse current app state. 
            // Since we don't have direct access to 'trades' prop here, we use the onExportString helper 
            // which gives us the current state, parse it, and send it.
            const currentDataStr = onExportString();
            const currentData = JSON.parse(currentDataStr);
            
            await uploadToCloud(currentData.trades, currentData.accounts);
            alert("Upload Successful! Your data is safe in the cloud.");
        } catch (error: any) {
            console.error(error);
            alert(`Upload Failed: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCloudDownload = async () => {
        if (!supabaseUrl || !supabaseKey || !syncId) {
            alert("Please configure Cloud Settings first.");
            return;
        }
        if(!window.confirm("This will OVERWRITE your current local data with data from the cloud. Continue?")) {
            return;
        }

        setIsSyncing(true);
        try {
            const data = await downloadFromCloud();
            if (data) {
                // We create a string representation to reuse the import logic
                const importStr = JSON.stringify(data);
                onImportString(importStr);
            } else {
                alert("No data found for this Sync ID.");
            }
        } catch (error: any) {
            console.error(error);
            alert(`Download Failed: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

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

             {/* Cloud Sync Section */}
             <section className="bg-white dark:bg-slate-800 rounded-xl border border-blue-500/20 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                        <Cloud className="h-6 w-6 mr-2 text-blue-500" />
                        Cloud Sync
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Connect to a free Supabase database to sync your data between devices.
                    </p>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Supabase Project URL</label>
                            <input 
                                type="text" 
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                placeholder="https://xyz.supabase.co"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Supabase Publishable Key</label>
                            <input 
                                type="password" 
                                value={supabaseKey}
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                placeholder="sb_publishable_..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sync ID (Secret Passphrase)</label>
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={syncId}
                                onChange={(e) => setSyncId(e.target.value)}
                                placeholder="my-secret-trading-id"
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:border-blue-500 outline-none font-mono"
                            />
                            <button 
                                onClick={handleSaveCloudConfig}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-200 transition-colors"
                            >
                                <Check className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Enter the SAME ID on both devices. This acts as your password.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <button 
                            onClick={handleCloudUpload}
                            disabled={isSyncing}
                            className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                            <Upload className="h-5 w-5 mr-2" />
                            {isSyncing ? 'Syncing...' : 'Upload to Cloud'}
                        </button>
                        <button 
                            onClick={handleCloudDownload}
                            disabled={isSyncing}
                            className="flex-1 flex items-center justify-center px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            {isSyncing ? 'Syncing...' : 'Download to Device'}
                        </button>
                    </div>
                </div>
            </section>

             {/* Legacy Manual Sync */}
             <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm opacity-75">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manual Transfer</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Copy/Paste code if you don't use Cloud Sync.
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={openExport}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                    </button>
                    <button 
                        onClick={openImport}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Paste Code
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
