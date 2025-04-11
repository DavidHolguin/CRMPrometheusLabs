// Removed invalid reference to "deno.worker"

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  insert: (data: any) => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  maybeSingle: () => Promise<{data: any; error: any}>;
  single: () => Promise<{data: any; error: any}>;
}

interface SupabaseClient {
  from: (table: string) => QueryBuilder;
  rpc: (
    fn: string,
    params?: Record<string, any>
  ) => Promise<{data: any; error: any}>;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.7" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
      };
    }
  ): SupabaseClient;
}

declare module "https://deno.land/std@0.220.1/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};