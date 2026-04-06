import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CHANNEL_ACCESS_TOKEN_RESUME = process.env.CHANNEL_ACCESS_TOKEN_RESUME || '';
const CHANNEL_ACCESS_TOKEN_REPORT = process.env.CHANNEL_ACCESS_TOKEN_REPORT || '';

export async function POST(request: NextRequest) {
  try {
    const { targetNickName, message, botType } = await request.json();

    if (!targetNickName || !message) {
      return NextResponse.json({ error: 'Missing targetNickName or message' }, { status: 400 });
    }

    // 1. Find user by nickname
    const { data: user } = await supabase
      .from('users')
      .select('line_user_id')
      .eq('nick_name', targetNickName.trim())
      .single();

    if (!user?.line_user_id) {
      console.log(`User not found for nickname: ${targetNickName}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Choose bot token
    const token = botType === 'REPORT' ? CHANNEL_ACCESS_TOKEN_REPORT : CHANNEL_ACCESS_TOKEN_RESUME;
    if (!token) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // 3. Send Line Push Message
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: user.line_user_id,
        messages: [{ type: 'text', text: message }],
      }),
    });

    const responseBody = await lineResponse.text();
    console.log(`Line API Response: ${lineResponse.status} - ${responseBody}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
