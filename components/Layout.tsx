import React, { useState } from 'react';
import { LayoutDashboard, History, Calendar, BrainCircuit, BarChart2, Wallet, Crosshair, Menu, X, Settings, Calculator, CandlestickChart, ArrowUpCircle } from 'lucide-react';
import { Account } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: any) => void;
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  syncStatus: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, accounts, selectedAccountId, onAccountChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'chart', label: 'Chart', icon: CandlestickChart },
    { id: 'history', label: 'Trade Log', icon: History },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ai', label: 'Mr. Wick AI', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="relative">
            <Crosshair className="h-8 w-8 text-gold-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">MR Wick</h1>
            <p className="text-[10px] text-gold-500 font-bold tracking-[0.2em] uppercase opacity-80">Trades Pro</p>
          </div>
        </div>

        <div className="p-4">
            <div className="relative group">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-hover:text-gold-500 transition-colors" />
                <select 
                    value={selectedAccountId}
                    onChange={(e) => onAccountChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 p-2.5 appearance-none focus:ring-2 focus:ring-gold-500/50 outline-none cursor-pointer"
                >
                    <option value="all">All Wallets</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                currentView === item.id
                  ? 'bg-gold-500 text-slate-900 shadow-lg shadow-gold-500/20 scale-[1.02]'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 ${currentView === item.id ? 'text-slate-900' : 'text-slate-500'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};