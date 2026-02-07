'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  PlusCircle, 
  Clock, 
  BarChart2, 
  Target, 
  ChevronUp, 
  RefreshCcw 
} from 'lucide-react';
import { toast } from 'sonner';

const mainNavItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/schedule', label: 'スケジュール', icon: Calendar },
  { href: '/pending', label: '進行中', icon: Clock },
  { href: '/input', label: '登録', icon: PlusCircle },
];

const subNavItems = [
  { href: '/analytics', label: 'チーム分析', icon: BarChart2 },
  { href: '/settings', label: '目標管理', icon: Target },
];

export function Navigation() {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login' || pathname === '/logout') {
    return null;
  }

  const handleClearCache = () => {
    if (!confirm('キャッシュを強制クリアして画面を再読み込みしますか？\n（ログイン情報の再入力が必要になる場合があります）')) return;
    
    // ストレージのクリア
    localStorage.clear();
    sessionStorage.clear();
    
    // サービスワーカーの解除 (もしあれば)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    toast.success('キャッシュをクリアしました。再起動します...');
    
    setTimeout(() => {
      window.location.href = '/'; // ルートに戻してリロード
    }, 1000);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-700/50">
      {/* サブメニュー (v1.33+) */}
      <div 
        className={`absolute bottom-full right-4 mb-4 w-48 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl transition-all duration-300 transform ${
          showSubMenu ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-2 space-y-1">
          {subNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowSubMenu(false)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                pathname === item.href ? 'bg-accent-primary/20 text-accent-primary' : 'hover:bg-dark-700 text-dark-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-bold">{item.label}</span>
            </Link>
          ))}
          
          <div className="my-1 border-t border-dark-700/50 mx-2" />
          
          {/* 強制キャッシュクリア (v1.51) */}
          <button
            onClick={handleClearCache}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-dark-400 hover:bg-accent-danger/10 hover:text-accent-danger"
          >
            <RefreshCcw className="w-5 h-5" />
            <span className="text-sm font-bold">キャッシュクリア</span>
          </button>
        </div>
      </div>

      {/* メインメニュー */}
      <div className="w-full">
        <div className="flex items-center justify-between">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowSubMenu(false)}
                className={`flex-1 flex flex-col items-center justify-center py-3 transition-all duration-200 ${
                  isActive ? 'bg-accent-primary/10 text-accent-primary' : 'text-dark-400'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[9px] font-bold ${isActive ? '' : 'text-dark-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 「その他」ボタン */}
          <button
            onClick={() => setShowSubMenu(!showSubMenu)}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all duration-200 ${
              showSubMenu || subNavItems.some(i => i.href === pathname)
                ? 'text-accent-primary' 
                : 'text-dark-400'
            }`}
          >
            <ChevronUp className={`w-5 h-5 mb-1 transition-transform ${showSubMenu ? 'rotate-180' : ''}`} />
            <span className="text-[9px] font-bold">その他</span>
          </button>
        </div>
      </div>
      <div className="h-safe-area-inset-bottom bg-dark-900/80" />

      {/* サブメニューを閉じるための全画面レイヤー */}
      {showSubMenu && (
        <div 
          className="fixed inset-0 -z-10" 
          onClick={() => setShowSubMenu(false)}
        />
      )}
    </nav>
  );
}
