import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key (first 20):', SUPABASE_ANON_KEY?.substring(0, 20));

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    console.log('✅ Supabase client created');

    // Test connection by checking auth state
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Error getting session:', error.message);
      return false;
    }

    console.log('✅ Connection successful!');
    console.log('Current session:', session ? 'Logged in' : 'Not logged in');

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}
