import React, { useState } from 'react';
import { LayoutDashboard, History, Calendar, BrainCircuit, BarChart2, Wallet, Upload, Download, Crosshair, Menu, X, Settings, Calculator, Cloud, Check, Loader2, AlertCircle, CandlestickChart } from 'lucide-react';
import { Account } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'history' | 'calendar' | 'ai' | 'analytics' | 'settings' | 'calculator' | 'chart';
  onNavigate: (view: 'dashboard' | 'history' | 'calendar' | 'ai' | 'analytics' | 'settings' | 'calculator' | 'chart') => void;
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, 
    currentView, 
    onNavigate, 
    accounts, 
    selectedAccountId, 
    onAccountChange,
    onImport,
    onExport,
    syncStatus
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'chart', label: 'Chart', icon: CandlestickChart },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'history', label: 'History', icon: History },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ai', label: 'AI Analyst', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleNavClick = (id: any) => {
      onNavigate(id);
      setIsMobileMenuOpen(false);
  };

  const getSyncIcon = () => {
      switch(syncStatus) {
          case 'syncing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
          case 'saved': return <Check className="h-4 w-4 text-emerald-500" />;
          case 'error': return <AlertCircle className="h-4 w-4 text-rose-500" />;
          default: return <Cloud className="h-4 w-4 text-slate-400" />;
      }
  };

  const getSyncText = () => {
      switch(syncStatus) {
          case 'syncing': return 'Syncing...';
          case 'saved': return 'Saved to Cloud';
          case 'error': return 'Sync Error';
          default: return 'Cloud Sync';
      }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center space-x-2">
            <div className="bg-gold-500/10 p-1.5 rounded">
                <Crosshair className="h-5 w-5 text-gold-600 dark:text-gold-500" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">MR Wick <span className="text-gold-600 dark:text-gold-500">Trades</span></span>
         </div>
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium">
                 {getSyncIcon()}
             </div>
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300">
                 {isMobileMenuOpen ? <X /> : <Menu />}
             </button>
         </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-xl md:shadow-none
      `}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 hidden md:flex items-center space-x-3">
          <div className="bg-gold-500/10 p-2 rounded-lg">
            <Crosshair className="h-6 w-6 text-gold-600 dark:text-gold-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">MR Wick <span className="text-gold-600 dark:text-gold-500">Trades</span></h1>
        </div>

        {/* Sync Status (Desktop) */}
        <div className="px-6 py-4 hidden md:block border-b border-slate-100 dark:border-slate-800/50">
             <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                 <span>Status</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                 {getSyncIcon()}
                 <span className={`text-sm font-medium ${syncStatus === 'saved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                     {getSyncText()}
                 </span>
             </div>
        </div>

        {/* Account Switcher */}
        <div className="p-4 mt-16 md:mt-0">
            <label className="text-xs text-slate-500 uppercase font-bold mb-2 block tracking-wider">Active Account</label>
            <div className="relative">
                <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select 
                    value={selectedAccountId}
                    onChange={(e) => onAccountChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-gold-500 focus:border-gold-500 block pl-9 p-2.5 appearance-none shadow-sm outline-none"
                >
                    <option value="all">All Accounts</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-gold-500/10 text-gold-600 dark:text-gold-500 shadow-sm border border-gold-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 ${currentView === item.id ? 'text-gold-600 dark:text-gold-500' : 'text-slate-500'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Sync</h3>
            <label className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
                <Upload className="h-4 w-4 mr-3" />
                Import File
                <input type="file" accept=".json,.csv" onChange={onImport} className="hidden" />
            </label>
            <button 
                onClick={onExport}
                className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
                <Download className="h-4 w-4 mr-3" />
                Export File
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
};
