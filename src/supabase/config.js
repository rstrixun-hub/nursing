import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qyysvpndbmupjuhlnhur.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GliiJZ81CxtA9mfBiPbgwg_L7u-N66I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);