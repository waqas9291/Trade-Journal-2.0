import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, BarChart3, Settings, Calculator, CandlestickChart, Plus, HelpCircle, GraduationCap, Zap, ChevronLeft, Wallet, Microscope } from 'lucide-react';
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
    { id: 'history', label: 'Daily Journal', icon: BookOpen },
    { id: 'backtesting', label: 'Backtesting', icon: Microscope },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'chart', label: 'Insights', icon: CandlestickChart },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'ai', label: 'Mentor Mode', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const secondaryItems = [
    { id: 'university', label: 'University', icon: GraduationCap },
    { id: 'help', label: 'Resource Center', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 font-inter">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#12162B] flex flex-col transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center">
             <span className="font-black text-white text-xs">TR</span>
          </div>
          <h1 className="text-lg font-black text-white tracking-tight">WICK <span className="text-slate-500">TRADES</span></h1>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={() => onNavigate('history')}
            className="w-full py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Add Trade
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center w-full px-4 py-2.5 text-[13px] font-semibold rounded-lg transition-all ${
                currentView === item.id
                  ? 'bg-slate-800/50 text-white border-l-4 border-indigo-500 rounded-l-none -ml-3 pl-6'
                  : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
              }`}
            >
              <item.icon className={`h-4 w-4 mr-3 ${currentView === item.id ? 'text-indigo-400' : 'text-slate-500'}`} />
              {item.label}
              {(item.id === 'chart' || item.id === 'backtesting') && <span className="ml-auto text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black">NEW</span>}
            </button>
          ))}

          <div className="py-4 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Resources</div>
          {secondaryItems.map((item) => (
            <button key={item.id} className="flex items-center w-full px-4 py-2.5 text-[13px] font-semibold text-slate-400 hover:text-slate-200">
               <item.icon className="h-4 w-4 mr-3 text-slate-500" />
               {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0F1222]">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                 <Zap className="h-4 w-4" />
              </div>
              <div>
                 <p className="text-xs font-bold text-white leading-none">Trading Pro</p>
                 <p className="text-[10px] text-slate-500 mt-1">Elite Account</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                 <MenuIcon className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                 <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">{currentView}</h2>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                 <Wallet className="h-4 w-4 text-slate-400" />
                 <select 
                    value={selectedAccountId}
                    onChange={(e) => onAccountChange(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                 >
                    <option value="all">Global Fund</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                 </select>
              </div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const MenuIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
);
