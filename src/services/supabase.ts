import { createClient, SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: The frontend client MUST ONLY use the public anon key.
// NEVER use the service_role key in the browser as it bypasses Row Level Security.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Initialize the Supabase client
// If the key starts with 'eyJ' and contains 'service_role', Supabase will throw an error in the browser.
export const supabase: SupabaseClient | null = (isValidUrl(supabaseUrl) && supabaseAnonKey) 
  ? createClient(supabaseUrl!, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!supabase;

export const getProfile = async (userId: string) => {
  if (!supabase) throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const saveAIFeedback = async (userId: string, responseType: 'chat' | 'mood', responseText: string, isHelpful: boolean) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('ai_feedback')
    .insert({
      user_id: userId,
      response_type: responseType,
      response_text: responseText,
      is_helpful: isHelpful,
      created_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error saving AI feedback:', error);
  }
};
