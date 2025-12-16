/// <reference types="vite/client" />

// Fallback type definitions to prevent build errors if packages are missing/unresolved
declare module '@supabase/supabase-js' {
    export const createClient: (url: string, key: string, options?: any) => any;
}
