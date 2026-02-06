import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsView } from '@/components/AnalyticsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'チーム分析 - TeamFlow',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AnalyticsView />
    </div>
  );
}
