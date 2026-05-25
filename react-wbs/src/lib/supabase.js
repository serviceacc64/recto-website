import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const configurationError = new Error(
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to react-wbs/.env, then restart the dev server.'
);

const createDisabledQuery = () => {
  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    single: () => Promise.resolve({ data: null, error: configurationError }),
    insert: () => Promise.resolve({ data: null, error: configurationError }),
    update: () => Promise.resolve({ data: null, error: configurationError }),
    upsert: () => Promise.resolve({ data: null, error: configurationError }),
    delete: () => query,
    then: (resolve) => resolve({ data: null, error: configurationError }),
  };

  return query;
};

const createDisabledSupabaseClient = () => ({
  from: () => createDisabledQuery(),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: configurationError }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    }),
    signInWithPassword: () => Promise.reject(configurationError),
    signOut: () => Promise.resolve({ error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: configurationError }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
});

if (!isSupabaseConfigured) {
  console.warn(configurationError.message);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDisabledSupabaseClient();
