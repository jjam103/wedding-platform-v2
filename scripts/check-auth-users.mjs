import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function checkAuthUsers() {
  console.log('Checking auth.users table...\n');
  
  // List all users in auth system
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('❌ No users found in auth.users table');
    console.log('\nYou need to create a user account first.');
    return;
  }
  
  console.log(`✅ Found ${users.length} user(s) in auth.users:\n`);
  users.forEach((user, i) => {
    console.log(`${i + 1}. Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    console.log('');
  });
  
  // Also check users table
  console.log('Checking public.users table...\n');
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('id, email, role')
    .order('created_at', { ascending: false });
  
  if (publicError) {
    console.error('❌ Error checking public.users:', publicError.message);
  } else if (!publicUsers || publicUsers.length === 0) {
    console.log('❌ No users found in public.users table');
  } else {
    console.log(`✅ Found ${publicUsers.length} user(s) in public.users:\n`);
    publicUsers.forEach((user, i) => {
      console.log(`${i + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
  }
}

checkAuthUsers();
