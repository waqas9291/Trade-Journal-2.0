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
import { Backtesting } from './components/Backtesting';
import { Trade, Account, Withdrawal, BacktestSession, BacktestTrade } from './types';
import { 
    loadTrades, saveTrades, 
    loadAccounts, saveAccounts, 
    loadWithdrawals, saveWithdrawals,
    loadBacktestSessions, saveBacktestSessions,
    loadBacktestTrades, saveBacktestTrades
} from './services/storage';
import { getCloudConfig, uploadToCloud, downloadFromCloud } from './services/cloud';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'calendar' | 'ai' | 'analytics' | 'settings' | 'calculator' | 'chart' | 'withdrawals' | 'backtesting'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [backtestSessions, setBacktestSessions] = useState<BacktestSession[]>([]);
  const [backtestTrades, setBacktestTrades] = useState<BacktestTrade[]>([]);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');

  const initialLoadRef = useRef(true);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Initial Load
  useEffect(() => {
    const loadedTrades = loadTrades();
    const loadedAccounts = loadAccounts();
    const loadedWithdrawals = loadWithdrawals();
    const loadedBacktestSessions = loadBacktestSessions();
    const loadedBacktestTrades = loadBacktestTrades();

    setTrades(loadedTrades);
    setWithdrawals(loadedWithdrawals);
    setBacktestSessions(loadedBacktestSessions);
    setBacktestTrades(loadedBacktestTrades);

    if (loadedAccounts.length === 0) {
      const defaultAcc = [{ id: '1', name: 'Elite Fund', currency: 'USD', balance: 50000 }];
      setAccounts(defaultAcc);
      saveAccounts(defaultAcc);
    } else {
      setAccounts(loadedAccounts);
    }

    const config = getCloudConfig();
    if (config.url && config.key && config.syncId) {
      setSyncStatus('syncing');
      downloadFromCloud().then(data => {
        if (data) {
          if (data.trades) setTrades(data.trades);
          if (data.accounts) setAccounts(data.accounts);
          setSyncStatus('saved');
        }
      }).catch(err => {
          console.error("Auto-pull failed", err);
          setSyncStatus('error');
      })
      .finally(() => initialLoadRef.current = false);
    } else {
      initialLoadRef.current = false;
    }
  }, []);

  // Debounced Auto-Sync
  useEffect(() => {
    if (initialLoadRef.current) return;

    saveTrades(trades);
    saveAccounts(accounts);
    saveWithdrawals(withdrawals);
    saveBacktestSessions(backtestSessions);
    saveBacktestTrades(backtestTrades);

    const config = getCloudConfig();
    if (config.url && config.key && config.syncId) {
      setSyncStatus('syncing');
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      
      syncTimeoutRef.current = window.setTimeout(async () => {
        try {
          await uploadToCloud(trades, accounts);
          setSyncStatus('saved');
        } catch (err) {
          console.error("Auto-sync failed", err);
          setSyncStatus('error');
        }
      }, 3000);
    }
  }, [trades, accounts, withdrawals, backtestSessions, backtestTrades]);

  const stats = useMemo(() => {
    const acc = accounts.find(a => a.id === selectedAccountId);
    const initial = acc ? acc.balance : accounts.reduce((s, a) => s + a.balance, 0);
    const filteredTrades = selectedAccountId === 'all' ? trades : trades.filter(t => t.accountId === selectedAccountId);
    const pnl = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    const filteredWithdrawals = withdrawals.filter(w => selectedAccountId === 'all' || w.accountId === selectedAccountId);
    const withdrawn = filteredWithdrawals.reduce((s, w) => s + w.amount, 0);
    return { initial, current: initial + pnl - withdrawn };
  }, [trades, accounts, withdrawals, selectedAccountId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-inter">
      <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        syncStatus={syncStatus}
      >
        <main className="p-0 h-[calc(100vh-56px)] overflow-y-auto custom-scrollbar">
          {currentView === 'dashboard' && <Dashboard trades={trades.filter(t => selectedAccountId === 'all' || t.accountId === selectedAccountId)} accountBalance={stats.current} />}
          {currentView === 'analytics' && <Analytics trades={trades.filter(t => selectedAccountId === 'all' || t.accountId === selectedAccountId)} accountBalance={stats.initial} currentBalance={stats.current} />}
          {currentView === 'history' && <TradeLog trades={trades} accounts={accounts} onAddTrade={(t) => setTrades([t, ...trades])} onDeleteTrade={(id) => setTrades(trades.filter(t => t.id !== id))} onUpdateTrade={(u) => setTrades(trades.map(t => t.id === u.id ? u : t))} />}
          {currentView === 'calendar' && <CalendarView trades={trades.filter(t => selectedAccountId === 'all' || t.accountId === selectedAccountId)} currencySymbol="$" />}
          {currentView === 'ai' && <AIAnalyst trades={trades} />}
          {currentView === 'calculator' && <Calculator balance={stats.current} />}
          {currentView === 'withdrawals' && <Withdrawals withdrawals={withdrawals} accounts={accounts} onAdd={(w) => setWithdrawals([w, ...withdrawals])} onDelete={(id) => setWithdrawals(withdrawals.filter(w => w.id !== id))} />}
          {currentView === 'chart' && <Chart />}
          {currentView === 'backtesting' && (
            <Backtesting 
                sessions={backtestSessions} 
                trades={backtestTrades}
                onAddSession={s => setBacktestSessions([...backtestSessions, s])}
                onDeleteSession={id => setBacktestSessions(backtestSessions.filter(s => s.id !== id))}
                onAddTrade={t => setBacktestTrades([...backtestTrades, t])}
                onDeleteTrade={id => setBacktestTrades(backtestTrades.filter(t => t.id !== id))}
            />
          )}
          {currentView === 'settings' && <Settings accounts={accounts} theme={theme} toggleTheme={setTheme} onAddAccount={a => setAccounts([...accounts, a])} onDeleteAccount={id => setAccounts(accounts.filter(ac => ac.id !== id))} onClearData={() => {}} onExportString={() => ""} onImportString={() => {}} />}
        </main>
      </Layout>
    </div>
  );
};

export default App;
