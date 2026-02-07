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

  const handleAppRefresh = () => {
    // v1.52: ログインセッション(localStorage)は維持しつつ、
    // ブラウザのデータキャッシュ(SessionStorage)とメモリ上のキャッシュのみを破棄して強制リロード
    
    toast.info('アプリを最新の状態に更新しています...');
    
    // 進行中の状態などを一時クリア
    sessionStorage.clear();
    
    // 1秒後に、キャッシュを無視して完全にサーバーから読み込み直す
    setTimeout(() => {
      // ログイン情報を残すため localStorage.clear() は行わない
      // window.location.reload(true) は非推奨だが、
      // 確実に最新を取得するためにURLにタイムスタンプを付与してリダイレクト
      const currentPath = window.location.pathname;
      window.location.href = `${currentPath}?refresh=${Date.now()}`;
    }, 800);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-700/50">
      {/* サブメニュー */}
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
          
          {/* 強制アプリ更新 (v1.52) */}
          <button
            onClick={handleAppRefresh}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-dark-400 hover:bg-accent-primary/10 hover:text-accent-primary"
          >
            <RefreshCcw className="w-5 h-5" />
            <span className="text-sm font-bold">アプリを更新</span>
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
