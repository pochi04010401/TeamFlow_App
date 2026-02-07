import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PendingTasks } from '@/components/PendingTasks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TsukiTips } from '@/components/TsukiTips';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '進行中タスク - TeamFlow',
};

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* ヘッダー */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-dark-100">進行中タスク</h1>
        <p className="text-sm text-dark-400">期限順に表示・タップで完了</p>
      </header>

      {/* タスク一覧 */}
      <ErrorBoundary>
        <PendingTasks />
      </ErrorBoundary>

      {/* ツキちゃんのコーナー（一番下へ移動） */}
      <div className="mt-12 pt-6 border-t border-dark-700/50">
        <TsukiTips />
      </div>
    </div>
  );
}
