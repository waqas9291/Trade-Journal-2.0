import { Trade, Account, Withdrawal, PriceAlert } from '../types';

const TRADES_KEY = 'tz_journal_trades';
const ACCOUNTS_KEY = 'tz_journal_accounts';
const WITHDRAWALS_KEY = 'tz_journal_withdrawals';
const ALERTS_KEY = 'tz_journal_alerts';

export const loadTrades = (): Trade[] => {
  try {
    const data = localStorage.getItem(TRADES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveTrades = (trades: Trade[]): void => {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
};

export const loadAccounts = (): Account[] => {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveAccounts = (accounts: Account[]): void => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const loadWithdrawals = (): Withdrawal[] => {
  try {
    const data = localStorage.getItem(WITHDRAWALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveWithdrawals = (withdrawals: Withdrawal[]): void => {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(withdrawals));
};

export const loadAlerts = (): PriceAlert[] => {
  try {
    const data = localStorage.getItem(ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveAlerts = (alerts: PriceAlert[]): void => {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
};