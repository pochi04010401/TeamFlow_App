import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TaskForm } from '@/components/TaskForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'タスク登録 - TeamFlow',
};

export default async function InputPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // メンバー一覧を取得 (v1.2)
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('created_at');

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* ヘッダー */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-dark-100">タスク登録</h1>
        <p className="text-sm text-dark-400">新しいタスクを追加</p>
      </header>

      {/* フォーム */}
      <ErrorBoundary>
        <TaskForm members={members || []} />
      </ErrorBoundary>
    </div>
  );
}
