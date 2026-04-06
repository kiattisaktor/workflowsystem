import { supabase } from './supabase';

export async function registerUser(lineUserId: string, displayName: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single();

    if (existing) {
      return { success: true, message: 'User already registered' };
    }

    // Insert new user
    const { error } = await supabase
      .from('users')
      .insert({
        line_user_id: lineUserId,
        display_name: displayName,
        nick_name: '',
        role: 'No Role',
        user_manager: '',
        password_hash: '',
        is_admin: false,
        can_create_task: false,
      });

    if (error) {
      console.error('Error registering user:', error);
      return { success: false, error: error.message };
    }

    return { success: true, message: 'User registered' };
  } catch (error) {
    console.error('Error registering user:', error);
    return { success: false, error: String(error) };
  }
}
