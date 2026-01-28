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
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node scripts/recreate-user.mjs <email> <password>');
  console.log('Example: node scripts/recreate-user.mjs user@example.com password123');
  process.exit(1);
}

async function recreateUser() {
  console.log(`Recreating user: ${email}\n`);
  
  // Step 1: Find existing user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }
  
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    console.log('Found existing user, deleting...');
    
    // Delete from public.users first (due to foreign key)
    const { error: deletePublicError } = await supabase
      .from('users')
      .delete()
      .eq('id', existingUser.id);
    
    if (deletePublicError) {
      console.error('❌ Error deleting from public.users:', deletePublicError.message);
      return;
    }
    console.log('✅ Deleted from public.users');
    
    // Delete from auth.users
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(existingUser.id);
    
    if (deleteAuthError) {
      console.error('❌ Error deleting from auth.users:', deleteAuthError.message);
      return;
    }
    console.log('✅ Deleted from auth.users\n');
  }
  
  // Step 2: Create new user
  console.log('Creating new user...');
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });
  
  if (createError) {
    console.error('❌ Error creating user:', createError.message);
    return;
  }
  
  console.log('✅ Created auth.users record');
  
  // Step 3: Create public.users record (trigger should do this, but let's be explicit)
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: newUser.user.id,
      email: email,
      role: 'host',
    });
  
  if (insertError) {
    // Trigger might have already created it
    if (insertError.code === '23505') {
      console.log('✅ public.users record already created by trigger');
    } else {
      console.error('❌ Error creating public.users record:', insertError.message);
      return;
    }
  } else {
    console.log('✅ Created public.users record');
  }
  
  console.log('\n✅ User recreated successfully!');
  console.log(`\nYou can now log in with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

recreateUser();
