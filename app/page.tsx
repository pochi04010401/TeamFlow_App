import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/components/Dashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-lg mx-auto p-4 pt-8">
      {/* ダッシュボード */}
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
    </div>
  );
}
