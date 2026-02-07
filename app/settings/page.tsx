import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsView } from '@/components/SettingsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '設定 - TeamFlow',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-lg mx-auto">
      <SettingsView />
    </div>
  );
}
