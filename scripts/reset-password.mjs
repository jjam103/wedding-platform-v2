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

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-password.mjs <email> <new-password>');
  console.log('Example: node scripts/reset-password.mjs user@example.com newpassword123');
  process.exit(1);
}

async function resetPassword() {
  console.log(`Resetting password for: ${email}\n`);
  
  // Get user by email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ User not found: ${email}`);
    return;
  }
  
  // Update password
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error('❌ Error updating password:', error.message);
    return;
  }
  
  console.log('✅ Password updated successfully!');
  console.log(`\nYou can now log in with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${newPassword}`);
}

resetPassword();
