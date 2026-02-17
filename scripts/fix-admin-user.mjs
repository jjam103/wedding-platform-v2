#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Checking admin user...');
  
  // Check if admin_users record exists
  const { data: existing } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'admin@example.com')
    .maybeSingle();
  
  if (existing) {
    console.log('✅ Admin user already exists:', existing);
    return;
  }
  
  console.log('📝 Creating admin_users record...');
  
  // Get auth user ID
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === 'admin@example.com');
  
  if (!authUser) {
    console.log('❌ Auth user not found - creating...');
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'test-password',
      email_confirm: true
    });
    
    if (createError) {
      console.log('❌ Error creating auth user:', createError);
      return;
    }
    
    console.log('✅ Created auth user:', newUser.user.id);
    
    // Create admin_users record
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        id: newUser.user.id,
        email: 'admin@example.com',
        role: 'owner',
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error creating admin_users record:', error);
    } else {
      console.log('✅ Created admin_users record:', data);
    }
    
    return;
  }
  
  console.log('✅ Found auth user:', authUser.id);
  
  // Create admin_users record
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      id: authUser.id,
      email: 'admin@example.com',
      role: 'owner',
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Created admin_users record:', data);
  }
}

main().catch(console.error);
