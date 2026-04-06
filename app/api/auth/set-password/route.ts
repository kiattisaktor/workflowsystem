import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SHA-256 hash (same as GAS backend)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, newPassword } = await request.json();

    if (!lineUserId || !newPassword) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('line_user_id', lineUserId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
