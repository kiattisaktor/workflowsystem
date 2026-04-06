import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SHA-256 hash (same algorithm as GAS backend, compatible with migrated data)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Query user by user_manager (username) and password_hash
    const { data: users, error } = await supabase
      .from('users')
      .select('line_user_id, display_name, nick_name, role, can_create_task, is_admin')
      .eq('user_manager', username.trim())
      .eq('password_hash', hashedPassword);

    if (error || !users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    return NextResponse.json({
      success: true,
      user: {
        id: user.line_user_id || '',
        name: user.display_name,
        nickName: user.nick_name,
        role: user.role,
        canCreateTask: user.can_create_task || false,
        isAdmin: user.is_admin || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
