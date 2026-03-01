import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export const createClient = () => {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321', // fallback to localhost to prevent crash if unconfigured
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'
    )
}
