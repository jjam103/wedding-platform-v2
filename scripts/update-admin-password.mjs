#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Finding admin user...');
  
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === 'admin@example.com');
  
  if (!authUser) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('✅ Found user:', authUser.id);
  console.log('🔄 Updating password to: test-password-123');
  
  const { error } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password: 'test-password-123' }
  );
  
  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Password updated successfully');
  }
}

main().catch(console.error);
