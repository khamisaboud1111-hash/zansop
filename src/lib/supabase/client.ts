import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached client if exists (singleton pattern)
  if (browserClient) return browserClient

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please check your Vercel project settings.')
    }

    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return browserClient
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    // Return a mock client that won't throw during render
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: new Error('Supabase client unavailable') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: new Error('Supabase client unavailable') }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
        upsert: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
        eq: function() { return this },
        neq: function() { return this },
        gt: function() { return this },
        gte: function() { return this },
        lt: function() { return this },
        lte: function() { return this },
        like: function() { return this },
        ilike: function() { return this },
        is: function() { return this },
        in: function() { return this },
        order: function() { return this },
        limit: function() { return this },
        single: function() { return this },
        maybeSingle: function() { return this },
      }),
      channel: () => ({
        on: function() { return this },
        subscribe: function() { return this },
        unsubscribe: function() { return this },
      }),
      removeChannel: () => {},
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
          download: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
          remove: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
          list: () => Promise.resolve({ data: null, error: new Error('Supabase client unavailable') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    } as any
  }
}

