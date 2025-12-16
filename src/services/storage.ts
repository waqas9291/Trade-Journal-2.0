import { Trade, Account } from '../types';

const TRADES_KEY = 'tz_journal_trades';
const ACCOUNTS_KEY = 'tz_journal_accounts';

export const loadTrades = (): Trade[] => {
  try {
    const data = localStorage.getItem(TRADES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load trades", e);
    return [];
  }
};

export const saveTrades = (trades: Trade[]): void => {
  try {
    localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error("Failed to save trades", e);
  }
};

export const loadAccounts = (): Account[] => {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load accounts", e);
    return [];
  }
};

export const saveAccounts = (accounts: Account[]): void => {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save accounts", e);
  }
};
