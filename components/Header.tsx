'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // ログインページでは表示しない
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/logout');
    setIsOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[60] glass border-b border-dark-700/50 h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-premium flex items-center justify-center shadow-glow-sm">
            <span className="text-sm font-bold text-white">TF</span>
          </div>
          <span className="font-black text-dark-100 tracking-tight text-lg">TeamFlow</span>
        </Link>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-dark-300 hover:text-white transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* サイドメニューオーバーレイ */}
      <div 
        className={`fixed inset-0 z-[70] bg-dark-950/80 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* ドロワーメニュー */}
      <nav className={`fixed top-0 right-0 bottom-0 z-[80] w-72 bg-dark-800 border-l border-dark-700 shadow-2xl transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-dark-500 uppercase tracking-widest">Menu</h2>
            <button onClick={() => setIsOpen(false)} className="text-dark-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-2 flex-1">
            {/* 分析メニューをここに移動 (v1.24) */}
            <Link 
              href="/analytics" 
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                pathname === '/analytics' ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-dark-700 text-dark-200'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="font-bold">チーム分析</span>
            </Link>

            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                pathname === '/settings' ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-dark-700 text-dark-200'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-bold">アプリ設定</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-dark-700">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 p-4 w-full rounded-xl text-accent-danger hover:bg-accent-danger/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold">ログアウト</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
