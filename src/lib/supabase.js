import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = "https://sssiuusragfwlpqpafjt.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_E3ZCg1UQCmaXin57fmdJNQ_Ej5s-azy";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);