'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // ログインページでは表示しない
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/logout');
  };

  return (
    <header className="sticky top-0 z-[60] glass border-b border-dark-700/50 h-16 flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-premium flex items-center justify-center shadow-glow-sm">
          <span className="text-sm font-bold text-white">TF</span>
        </div>
        <span className="font-black text-dark-100 tracking-tight text-lg">TeamFlow</span>
      </Link>

      {/* ログアウトボタン (ドアのアイコン v1.33) */}
      <button 
        onClick={handleLogout}
        className="p-2 -mr-2 text-dark-400 hover:text-accent-danger transition-colors"
        title="ログアウト"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </header>
  );
}
