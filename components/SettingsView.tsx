'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Save, Loader2, Calendar, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentMonth, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export function SettingsView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [goalData, setGoalData] = useState({
    target_amount: 10000,
    target_points: 1000
  });

  const fetchGoal = async (month: string) => {
    setFetching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month', month);

      if (error) throw error;

      if (data && data.length > 0) {
        setGoalData({
          target_amount: data[0].target_amount / 1000,
          target_points: data[0].target_points
        });
      } else {
        setGoalData({ target_amount: 10000, target_points: 1000 });
      }
    } catch (err) {
      console.error(err);
      toast.error('目標データの取得に失敗しました');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchGoal(selectedMonth);
  }, [selectedMonth]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: existing } = await supabase
        .from('monthly_goals')
        .select('id')
        .eq('month', selectedMonth);

      const payload = {
        month: selectedMonth,
        target_amount: goalData.target_amount * 1000,
        target_points: goalData.target_points
      };

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('monthly_goals')
          .update(payload)
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('monthly_goals')
          .insert([payload]);
        if (error) throw error;
      }

      toast.success(`${selectedMonth}の目標を保存しました！`);
      router.refresh();
      await fetchGoal(selectedMonth);
    } catch (err) {
      console.error('Settings save error:', err);
      const errorMessage = err instanceof Error ? err.message : '保存に失敗しました';
      const errorCode = (err as any)?.code || 'UNKNOWN';
      toast.error(`保存に失敗しました (${errorCode})`, {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-32 px-4 text-dark-100">
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-accent-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-accent-primary">
          <Target className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black">目標管理</h1>
        <p className="text-sm text-dark-500 mt-1">月間目標の数値を設定します</p>
      </div>

      <div className="card p-6 space-y-6 border-t-4 border-accent-primary">
        <div className="flex items-center justify-between bg-dark-700/50 p-2 rounded-xl border border-dark-600">
          <button onClick={() => changeMonth(-1)} className="p-3 hover:text-accent-primary transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-dark-400 font-bold uppercase tracking-widest">対象月</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-primary" />
              <span className="font-black text-xl">{selectedMonth.replace('-', '年')}月</span>
            </div>
          </div>
          <button onClick={() => changeMonth(1)} className="p-3 hover:text-accent-primary transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {fetching ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-accent-primary" />
            <p className="text-sm text-dark-500 font-medium">読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-xs font-black uppercase text-dark-400 tracking-widest">売上目標</label>
                <span className="text-[10px] font-mono text-dark-500 opacity-50">{formatNumber(goalData.target_amount * 1000)} 円</span>
              </div>
              <div className="relative flex items-center gap-3">
                <input
                  type="number"
                  value={goalData.target_amount}
                  onChange={(e) => setGoalData({ ...goalData, target_amount: Number(e.target.value) })}
                  className="input-premium px-4 w-full h-14 text-lg font-bold"
                  placeholder="10000"
                />
                <span className="text-sm font-black text-dark-200 flex-shrink-0 bg-dark-700 px-3 py-4 rounded-xl border border-dark-600">千円</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-400 tracking-widest ml-1">ポイント目標</label>
              <div className="relative group">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-accent-warning transition-colors" />
                <input
                  type="number"
                  value={goalData.target_points}
                  onChange={(e) => setGoalData({ ...goalData, target_points: Number(e.target.value) })}
                  className="input-premium pl-12 h-14 text-lg font-bold"
                  placeholder="1000"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full h-16 text-lg font-black shadow-glow mt-4 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> この月の目標を保存</>}
            </button>
          </div>
        )}
      </div>

      <div className="card p-5 bg-dark-800/50 border-dark-700">
        <h3 className="text-xs font-black text-dark-500 uppercase tracking-widest mb-3">ヘルプ</h3>
        <ul className="text-xs text-dark-400 space-y-2 leading-relaxed">
          <li className="flex gap-2">• <span className="flex-1">売上目標は「千円」単位で入力してください。</span></li>
          <li className="flex gap-2">• <span className="flex-1">保存した目標は、ダッシュボードの達成率メーターに即座に反映されます。</span></li>
          <li className="flex gap-2">• <span className="flex-1">過去の月の目標を変更することも可能です。</span></li>
        </ul>
      </div>
    </div>
  );
}
