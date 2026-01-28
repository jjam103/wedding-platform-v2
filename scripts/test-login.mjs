import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use the same client that the frontend uses
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = process.argv[2] || 'jrnabelsohn@gmail.com';
const password = process.argv[3] || 'WeddingAdmin2026!';

async function testLogin() {
  console.log(`Testing login with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`\nSupabase URL: ${supabaseUrl}`);
  console.log(`Using anon key: ${supabaseAnonKey.substring(0, 20)}...\n`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error code:', error.status);
      console.error('Full error:', JSON.stringify(error, null, 2));
      return;
    }
    
    if (data.session) {
      console.log('✅ Login successful!');
      console.log('\nSession details:');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Access token:', data.session.access_token.substring(0, 30) + '...');
      console.log('Expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
    } else {
      console.log('❌ No session returned');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testLogin();
