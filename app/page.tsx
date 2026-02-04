import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/components/Dashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LogOut, Settings } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* ヘッダー */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-purple-400 bg-clip-text text-transparent">
            TeamFlow
          </h1>
          <p className="text-sm text-dark-400">今月の進捗をチェック</p>
        </div>
        <form action="/api/auth/signout" method="post">
          <button 
            type="submit"
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-5 h-5 text-dark-400" />
          </button>
        </form>
      </header>

      {/* ダッシュボード */}
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </div>
  );
}
