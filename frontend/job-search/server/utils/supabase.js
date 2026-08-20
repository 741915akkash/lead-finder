import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabase() {
  if (client) return client;

  const config = useRuntimeConfig();

  client = createClient(config.supabaseUrl, config.supabaseServiceKey);

  return client;
}
