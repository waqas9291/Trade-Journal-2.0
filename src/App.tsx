import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TradeLog } from './components/TradeLog';
import { CalendarView } from './components/CalendarView';
import { AIAnalyst } from './components/AIAnalyst';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Calculator } from './components/Calculator';
import { Trade, Account } from './types';
import { loadTrades, saveTrades, loadAccounts, saveAccounts } from './services/storage';
import { parseCSV } from './services/csvParser';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'calendar' | 'ai' | 'analytics' | 'settings' | 'calculator'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Theme Management
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial Load
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
  }, []);

  // Persistence
  useEffect(() => {
    saveTrades(trades);
  }, [trades]);

  useEffect(() => {
    saveAccounts(accounts);
  }, [accounts]);

  const handleAddTrade = (newTrade: Trade) => {
    setTrades(prev => [newTrade, ...prev]);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
  };

  const handleAddAccount = (newAccount: Account) => {
      setAccounts(prev => [...prev, newAccount]);
      if (accounts.length === 0) {
          setSelectedAccountId(newAccount.id);
      }
  };

  const handleDeleteAccount = (id: string) => {
      if (accounts.length <= 1) {
          alert("You must have at least one account.");
          return;
      }
      setAccounts(prev => prev.filter(a => a.id !== id));
      if (selectedAccountId === id) {
          setSelectedAccountId('all');
      }
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
                  // Use the active account ID or the first account available
                  const targetAccount = selectedAccountId !== 'all' ? selectedAccountId : (accounts[0]?.id || '1');
                  const parsedTrades = parseCSV(content, targetAccount);
                  
                  setTrades(prev => {
                      // Create a map of existing trades for quick lookup
                      const existingMap = new Map<string, Trade>();
                      prev.forEach(t => existingMap.set(t.id, t));
                      
                      let newCount = 0;
                      let updateCount = 0;

                      // Update existing trades or add new ones
                      parsedTrades.forEach(t => {
                          const existing = existingMap.get(t.id);
                          if (existing) {
                              existingMap.set(t.id, { ...existing, ...t });
                              updateCount++;
                          } else {
                              existingMap.set(t.id, t);
                              newCount++;
                          }
                      });

                      alert(`Import complete.\nAdded: ${newCount} trades\nUpdated: ${updateCount} trades`);
                      
                      // Convert map back to array and sort by date descending
                      return Array.from(existingMap.values()).sort((a, b) => 
                          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
                      );
                  });
              } catch (err) {
                  console.error(err);
                  alert('Error parsing CSV file. Please check the format.');
              }
          } else {
              // Assume JSON
              try {
                  const json = JSON.parse(content);
                  if (Array.isArray(json)) {
                      setTrades(json);
                      alert('Trades imported successfully!');
                  }
              } catch (err) {
                  alert('Invalid file format. Please upload a valid JSON or CSV.');
              }
          }
      };
      reader.readAsText(file);
      // Reset input value to allow re-uploading the same file if needed
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

  // Filter trades based on selected account
  const filteredTrades = useMemo(() => {
      if (selectedAccountId === 'all') return trades;
      return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

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
      >
        <main className="p-4 md:p-6 overflow-y-auto h-full">
          {currentView === 'dashboard' && (
            <Dashboard 
                trades={filteredTrades} 
                accountBalance={accounts.find(a => a.id === selectedAccountId)?.balance || 0}
            />
          )}
          {currentView === 'analytics' && (
             <Analytics 
                trades={filteredTrades}
                accountBalance={accounts.find(a => a.id === selectedAccountId)?.balance || 0}
             />
          )}
          {currentView === 'history' && (
            <TradeLog 
                trades={filteredTrades} 
                accounts={accounts}
                onAddTrade={handleAddTrade}
                onDeleteTrade={handleDeleteTrade}
                onUpdateTrade={handleUpdateTrade}
            />
          )}
          {currentView === 'calendar' && (
            <CalendarView trades={filteredTrades} />
          )}
          {currentView === 'calculator' && (
            <Calculator />
          )}
          {currentView === 'ai' && (
            <AIAnalyst trades={filteredTrades} />
          )}
          {currentView === 'settings' && (
            <Settings 
                accounts={accounts}
                onAddAccount={handleAddAccount}
                onDeleteAccount={handleDeleteAccount}
                theme={theme}
                toggleTheme={setTheme}
                onClearData={handleClearData}
            />
          )}
        </main>
      </Layout>
    </div>
  );
};

export default App;