/// <reference types="vite/client" />

// Fallback type definitions to prevent build errors if packages are missing/unresolved
declare module '@supabase/supabase-js' {
    export const createClient: (url: string, key: string, options?: any) => any;
}

declare module '@google/genai' {
    export class GoogleGenAI {
        constructor(config: { apiKey: string });
        chats: {
            create: (config: { model: string, history?: any[], config?: any }) => any;
        };
        models: {
            generateContent: (config: any) => Promise<any>;
        };
    }
    export type Content = any;
    export type Part = any;
}
