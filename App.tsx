import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TradeLog } from './components/TradeLog';
import { CalendarView } from './components/CalendarView';
import { AIAnalyst } from './components/AIAnalyst';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Calculator } from './components/Calculator';
import { Chart } from './components/Chart';
import { Withdrawals } from './components/Withdrawals';
import { Trade, Account, Withdrawal } from './types';
import { loadTrades, saveTrades, loadAccounts, saveAccounts, loadWithdrawals, saveWithdrawals } from './services/storage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'calendar' | 'ai' | 'analytics' | 'settings' | 'calculator' | 'chart' | 'withdrawals'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const loadedTrades = loadTrades();
    const loadedAccounts = loadAccounts();
    const loadedWithdrawals = loadWithdrawals();

    setTrades(loadedTrades);
    setWithdrawals(loadedWithdrawals);

    if (loadedAccounts.length === 0) {
      const defaultAccount = [{ id: '1', name: 'Elite Fund', currency: 'USD', balance: 50000 }];
      setAccounts(defaultAccount);
      saveAccounts(defaultAccount);
    } else {
      setAccounts(loadedAccounts);
    }
  }, []);

  useEffect(() => {
    saveTrades(trades);
    saveAccounts(accounts);
    saveWithdrawals(withdrawals);
  }, [trades, accounts, withdrawals]);

  const accountStats = useMemo(() => {
    const acc = accounts.find(a => a.id === selectedAccountId);
    const initialBalance = acc ? acc.balance : accounts.reduce((sum, a) => sum + a.balance, 0);
    
    const filteredTrades = selectedAccountId === 'all' ? trades : trades.filter(t => t.accountId === selectedAccountId);
    const totalPnl = filteredTrades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + t.pnl, 0);
    
    const filteredWithdrawals = selectedAccountId === 'all' ? withdrawals : withdrawals.filter(w => w.accountId === selectedAccountId);
    const totalWithdrawn = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      initialBalance,
      totalPnl,
      totalWithdrawn,
      currentBalance: initialBalance + totalPnl - totalWithdrawn
    };
  }, [trades, accounts, withdrawals, selectedAccountId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        syncStatus="idle"
      >
        <main className="p-4 md:p-6 h-full overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard trades={trades.filter(t => selectedAccountId === 'all' || t.accountId === selectedAccountId)} accountBalance={accountStats.currentBalance} />}
          {currentView === 'withdrawals' && <Withdrawals withdrawals={withdrawals} onAdd={(w) => setWithdrawals([w, ...withdrawals])} onDelete={(id) => setWithdrawals(withdrawals.filter(w => w.id !== id))} accounts={accounts} />}
          {currentView === 'chart' && <Chart />}
          {currentView === 'history' && <TradeLog trades={trades} accounts={accounts} onAddTrade={(t) => setTrades([t, ...trades])} onDeleteTrade={(id) => setTrades(trades.filter(t => t.id !== id))} onUpdateTrade={(ut) => setTrades(trades.map(t => t.id === ut.id ? ut : t))} />}
          {currentView === 'ai' && <AIAnalyst trades={trades} />}
          {currentView === 'analytics' && <Analytics trades={trades} accountBalance={accountStats.initialBalance} />}
          {currentView === 'calendar' && <CalendarView trades={trades} currencySymbol="$" />}
          {currentView === 'calculator' && <Calculator />}
          {currentView === 'settings' && <Settings accounts={accounts} onAddAccount={(a) => setAccounts([...accounts, a])} onDeleteAccount={(id) => setAccounts(accounts.filter(a => a.id !== id))} theme={theme} toggleTheme={setTheme} onClearData={() => {}} onExportString={() => ""} onImportString={() => {}} />}
        </main>
      </Layout>
    </div>
  );
};

export default App;