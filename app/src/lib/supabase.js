import { createClient } from '@supabase/supabase-js'

let client

export function getSupabaseClient() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error(
      'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar las cuentas.',
    )
  }

  if (!client) {
    client = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  }

  return client
}
