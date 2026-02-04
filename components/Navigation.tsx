'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PlusCircle, Clock, Download } from 'lucide-react';

const navItems = [
  { href: '/', label: 'ホーム', icon: Home },
  { href: '/schedule', label: 'スケジュール', icon: Calendar },
  { href: '/pending', label: '進行中', icon: Clock },
  { href: '/input', label: '登録', icon: PlusCircle },
];

export function Navigation() {
  const pathname = usePathname();

  // ログインページとログアウトページでは表示しない
  if (pathname === '/login' || pathname === '/logout') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-700/50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-accent-primary' : ''}`} />
                <span className={`text-xs ${isActive ? 'text-accent-primary font-medium' : ''}`}>
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
