#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Verifying admin user setup...\n');
  
  const email = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';
  
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('');
  
  // 1. Check if auth user exists
  console.log('1️⃣ Checking auth user...');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);
  
  if (!authUser) {
    console.log('❌ Auth user not found');
    console.log('Creating auth user...');
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (createError) {
      console.log('❌ Error creating auth user:', createError);
      return;
    }
    
    console.log('✅ Created auth user:', newUser.user.id);
  } else {
    console.log('✅ Auth user exists:', authUser.id);
    console.log('   Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Created at:', authUser.created_at);
    console.log('   Last sign in:', authUser.last_sign_in_at || 'Never');
  }
  
  // 2. Check if admin_users record exists
  console.log('\n2️⃣ Checking admin_users record...');
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  if (adminError) {
    console.log('❌ Error querying admin_users:', adminError);
    return;
  }
  
  if (!adminUser) {
    console.log('❌ Admin user record not found');
    console.log('Creating admin_users record...');
    
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.id,
        email,
        role: 'owner',
        status: 'active'
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Error creating admin_users record:', insertError);
      return;
    }
    
    console.log('✅ Created admin_users record:', newAdmin);
  } else {
    console.log('✅ Admin user record exists');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Status:', adminUser.status);
  }
  
  // 3. Update password to ensure it matches
  console.log('\n3️⃣ Updating password...');
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password }
  );
  
  if (updateError) {
    console.log('❌ Error updating password:', updateError);
    return;
  }
  
  console.log('✅ Password updated successfully');
  
  // 4. Test login with anon key (simulating browser login)
  console.log('\n4️⃣ Testing login with anon key...');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email,
    password
  });
  
  if (loginError) {
    console.log('❌ Login failed:', loginError);
    console.log('   Status:', loginError.status);
    console.log('   Message:', loginError.message);
    console.log('   Name:', loginError.name);
    return;
  }
  
  console.log('✅ Login successful!');
  console.log('   User ID:', loginData.user.id);
  console.log('   Email:', loginData.user.email);
  console.log('   Session expires:', loginData.session.expires_at);
  
  // 5. Verify middleware will work
  console.log('\n5️⃣ Verifying middleware access...');
  const { data: adminCheck, error: adminCheckError } = await anonClient
    .from('admin_users')
    .select('role, status')
    .eq('id', loginData.user.id)
    .single();
  
  if (adminCheckError) {
    console.log('❌ Error checking admin access:', adminCheckError);
    return;
  }
  
  console.log('✅ Admin access verified');
  console.log('   Role:', adminCheck.role);
  console.log('   Status:', adminCheck.status);
  console.log('   Allowed:', ['owner', 'admin'].includes(adminCheck.role) && adminCheck.status === 'active' ? 'Yes' : 'No');
  
  console.log('\n✨ All checks passed! Admin login should work.');
}

main().catch(console.error);
