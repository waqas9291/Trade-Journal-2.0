import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { TradeLog } from './components/TradeLog.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { AIAnalyst } from './components/AIAnalyst.tsx';
import { Analytics } from './components/Analytics.tsx';
import { Settings } from './components/Settings.tsx';
import { Calculator } from './components/Calculator.tsx';
import { Chart } from './components/Chart.tsx';
import { Trade, Account } from './types.ts';
import { loadTrades, saveTrades, loadAccounts, saveAccounts } from './services/storage.ts';
import { parseCSV } from './services/csvParser.ts';
import { getCloudConfig, uploadToCloud, downloadFromCloud } from './services/cloud.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'calendar' | 'ai' | 'analytics' | 'settings' | 'calculator' | 'chart'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const initialLoadRef = useRef(true);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const loadedTrades = loadTrades();
    const loadedAccounts = loadAccounts();
    
    setTrades(loadedTrades);

    if (loadedAccounts.length === 0) {
        const defaultAccounts = [
            { id: '1', name: 'Main Account', currency: 'USD', balance: 10000 },
        ];
        setAccounts(defaultAccounts);
        saveAccounts(defaultAccounts);
    } else {
        setAccounts(loadedAccounts);
    }

    const config = getCloudConfig();
    if (config.url && config.key && config.syncId) {
        setSyncStatus('syncing');
        downloadFromCloud().then(data => {
            if (data) {
                setTrades(data.trades);
                setAccounts(data.accounts);
                setSyncStatus('saved');
            } else {
                setSyncStatus('idle');
            }
        }).catch(err => {
            console.error("Auto-download failed:", err);
            setSyncStatus('error');
        }).finally(() => {
             initialLoadRef.current = false;
        });
    } else {
        initialLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    saveTrades(trades);
    saveAccounts(accounts);

    if (initialLoadRef.current) return;

    const config = getCloudConfig();
    if (config.url && config.key && config.syncId) {
        setSyncStatus('syncing');
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = window.setTimeout(async () => {
            try {
                await uploadToCloud(trades, accounts);
                setSyncStatus('saved');
            } catch (err) {
                console.error("Auto-upload failed", err);
                setSyncStatus('error');
            }
        }, 2000);
    }
  }, [trades, accounts]);

  const handleAddTrade = (newTrade: Trade) => setTrades(prev => [newTrade, ...prev]);
  const handleDeleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id));
  const handleUpdateTrade = (updatedTrade: Trade) => setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));

  const handleAddAccount = (newAccount: Account) => {
      setAccounts(prev => [...prev, newAccount]);
      if (accounts.length === 0) setSelectedAccountId(newAccount.id);
  };

  const handleDeleteAccount = (id: string) => {
      if (accounts.length <= 1) {
          alert("You must have at least one account.");
          return;
      }
      setAccounts(prev => prev.filter(a => a.id !== id));
      if (selectedAccountId === id) setSelectedAccountId('all');
  };

  const handleClearData = () => {
      setTrades([]);
      const defaultAccounts = [{ id: '1', name: 'Main Account', currency: 'USD', balance: 10000 }];
      setAccounts(defaultAccounts);
      saveAccounts(defaultAccounts);
      saveTrades([]);
      alert("Application reset successfully.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (file.name.toLowerCase().endsWith('.csv')) {
              try {
                  const targetAccount = selectedAccountId !== 'all' ? selectedAccountId : (accounts[0]?.id || '1');
                  const parsedTrades = parseCSV(content, targetAccount);
                  setTrades(prev => {
                      const existingMap = new Map<string, Trade>();
                      prev.forEach(t => existingMap.set(t.id, t));
                      parsedTrades.forEach(t => {
                          const existing = existingMap.get(t.id);
                          if (existing) existingMap.set(t.id, { ...existing, ...t });
                          else existingMap.set(t.id, t);
                      });
                      return Array.from(existingMap.values()).sort((a, b) => 
                          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
                      );
                  });
              } catch (err) {
                  alert('Error parsing CSV file.');
              }
          } else {
              try {
                  const json = JSON.parse(content);
                  if (Array.isArray(json)) setTrades(json);
              } catch (err) {
                  alert('Invalid file format.');
              }
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "mr_wick_trades_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const getExportString = () => JSON.stringify({ trades, accounts, version: '1.0' });

  const handleImportString = (jsonString: string) => {
      try {
          const data = JSON.parse(jsonString);
          if (data.trades) setTrades(data.trades);
          if (data.accounts) setAccounts(data.accounts);
          alert("Data synchronized successfully!");
      } catch (e) {
          alert("Invalid data code.");
      }
  };

  const filteredTrades = useMemo(() => {
      if (selectedAccountId === 'all') return trades;
      return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);
  
  const activeCurrency = useMemo(() => {
      if (selectedAccountId === 'all') return '$';
      const account = accounts.find(a => a.id === selectedAccountId);
      switch(account?.currency) {
          case 'EUR': return '€';
          case 'GBP': return '£';
          case 'JPY': return '¥';
          default: return '$';
      }
  }, [accounts, selectedAccountId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        onImport={handleImport}
        onExport={handleExport}
        syncStatus={syncStatus}
      >
        <main className="p-4 md:p-6 overflow-y-auto h-full">
          {currentView === 'dashboard' && <Dashboard trades={filteredTrades} accountBalance={accounts.find(a => a.id === selectedAccountId)?.balance || 0} />}
          {currentView === 'analytics' && <Analytics trades={filteredTrades} accountBalance={accounts.find(a => a.id === selectedAccountId)?.balance || 0} />}
          {currentView === 'history' && <TradeLog trades={filteredTrades} accounts={accounts} onAddTrade={handleAddTrade} onDeleteTrade={handleDeleteTrade} onUpdateTrade={handleUpdateTrade} />}
          {currentView === 'calendar' && <CalendarView trades={filteredTrades} currencySymbol={activeCurrency} />}
          {currentView === 'calculator' && <Calculator />}
          {currentView === 'chart' && <Chart />}
          {currentView === 'ai' && <AIAnalyst trades={filteredTrades} />}
          {currentView === 'settings' && <Settings accounts={accounts} onAddAccount={handleAddAccount} onDeleteAccount={handleDeleteAccount} theme={theme} toggleTheme={setTheme} onClearData={handleClearData} onExportString={getExportString} onImportString={handleImportString} />}
        </main>
      </Layout>
    </div>
  );
};

export default App;
