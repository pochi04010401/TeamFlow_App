import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TeamCalendar } from '@/components/TeamCalendar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'スケジュール - TeamFlow',
};

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* ヘッダー */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-dark-100">スケジュール</h1>
        <p className="text-sm text-dark-400">タスクをタップして完了</p>
      </header>

      {/* カレンダー */}
      <ErrorBoundary>
        <TeamCalendar />
      </ErrorBoundary>
    </div>
  );
}
