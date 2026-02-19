import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey: 'blinktest-auth',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            // Bypass Navigator LockManager to prevent timeout errors
            return await fn();
        },
    },
});
