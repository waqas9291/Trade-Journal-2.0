import { createClient } from '@supabase/supabase-js';
import { Trade, Account } from '../types';

// We store the user's API credentials in localStorage so they persist
// but we don't hardcode them in the app code for security/flexibility.
const SUPABASE_URL_KEY = 'tz_supabase_url';
const SUPABASE_KEY_KEY = 'tz_supabase_key';
const SYNC_ID_KEY = 'tz_sync_id';

export const getCloudConfig = () => {
    return {
        url: localStorage.getItem(SUPABASE_URL_KEY) || '',
        key: localStorage.getItem(SUPABASE_KEY_KEY) || '',
        syncId: localStorage.getItem(SYNC_ID_KEY) || ''
    };
};

export const saveCloudConfig = (url: string, key: string, syncId: string) => {
    localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    localStorage.setItem(SYNC_ID_KEY, syncId.trim());
};

const getClient = () => {
    const { url, key } = getCloudConfig();
    if (!url || !key) return null;
    return createClient(url, key);
};

export const uploadToCloud = async (trades: Trade[], accounts: Account[]) => {
    const client = getClient();
    const { syncId } = getCloudConfig();

    if (!client || !syncId) throw new Error("Missing Cloud Configuration");

    const payload = {
        id: syncId,
        data: { trades, accounts },
        updated_at: new Date().toISOString()
    };

    // Upsert means: Insert if new, Update if exists
    const { error } = await client
        .from('backups')
        .upsert(payload, { onConflict: 'id' });

    if (error) throw error;
    return true;
};

export const downloadFromCloud = async () => {
    const client = getClient();
    const { syncId } = getCloudConfig();

    if (!client || !syncId) throw new Error("Missing Cloud Configuration");

    const { data, error } = await client
        .from('backups')
        .select('*')
        .eq('id', syncId)
        .single();

    if (error) throw error;
    return data?.data as { trades: Trade[], accounts: Account[] } | null;
};
