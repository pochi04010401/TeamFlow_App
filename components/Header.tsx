'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  // ログインページでは表示しない
  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-[60] glass border-b border-dark-700/50 h-16 flex items-center justify-center px-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-premium flex items-center justify-center shadow-glow-sm">
          <span className="text-sm font-bold text-white">TF</span>
        </div>
        <span className="font-black text-dark-100 tracking-tight text-lg">TeamFlow</span>
      </Link>
    </header>
  );
}
