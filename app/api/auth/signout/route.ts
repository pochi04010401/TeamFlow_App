import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  
  await supabase.auth.signOut();

  // v1.1: ログアウト後は /logout サンクスページへ
  return NextResponse.redirect(new URL('/logout', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    status: 302,
  });
}
