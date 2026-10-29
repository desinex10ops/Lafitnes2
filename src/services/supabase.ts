import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente fornecidas pelo Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('sua-url-supabase') &&
    !supabaseUrl.includes('seu-projeto-supabase') &&
    !supabaseAnonKey.includes('sua-chave') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
