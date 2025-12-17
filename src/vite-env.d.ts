
interface ImportMetaEnv {
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

declare module '@supabase/supabase-js' {
    export const createClient: (url: string, key: string, options?: any) => any;
}
