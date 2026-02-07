'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PlusCircle, Clock, BarChart2, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/schedule', label: 'スケジュール', icon: Calendar },
  { href: '/analytics', label: '分析', icon: BarChart2 },
  { href: '/pending', label: '進行中', icon: Clock },
  { href: '/input', label: '登録', icon: PlusCircle },
  { href: '/settings', label: '設定', icon: Settings }, // v1.22: 追加
];

export function Navigation() {
  const pathname = usePathname();

  // ログインページとログアウトページでは表示しない
  if (pathname === '/login' || pathname === '/logout') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-700/50">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between min-w-[max-content] md:min-w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-w-[64px] flex flex-col items-center justify-center py-3 transition-all duration-200 ${
                  isActive ? 'bg-accent-primary/5 text-accent-primary' : 'text-dark-400'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[8px] font-bold tracking-tighter ${isActive ? '' : 'text-dark-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-dark-900/80" />
    </nav>
  );
}
