import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, email, role } = await request.json();

    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client with secret key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use secret key client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Wait a moment for auth.users to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify user exists in auth.users first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      console.error('User not found in auth.users:', authError);
      // Try again after another delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { data: retryAuthUser, error: retryAuthError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (retryAuthError || !retryAuthUser) {
        return NextResponse.json(
          { error: 'User not found in authentication system' },
          { status: 404 }
        );
      }
    }

    // Insert user record
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        role: role,
      });

    if (insertError) {
      console.error('Error inserting user:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user record', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
