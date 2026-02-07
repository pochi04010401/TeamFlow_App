'use client';

import { useState, useEffect } from 'react';
import { Settings, Target, Save, Loader2, Calendar, DollarSign, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentMonth, formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

export function SettingsView() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [goalData, setGoalData] = useState({
    target_amount: 10000, // k-yen
    target_points: 1000
  });

  const fetchGoal = async (month: string) => {
    setFetching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('monthly_goals')
        .select('*')
        .eq('month', month)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setGoalData({
          target_amount: data.target_amount / 1000,
          target_points: data.target_points
        });
      } else {
        // デフォルト値
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
      
      // UPSERT (monthをキーにする)
      const { error } = await supabase
        .from('monthly_goals')
        .upsert({
          month: selectedMonth,
          target_amount: goalData.target_amount * 1000,
          target_points: goalData.target_points
        }, { onConflict: 'month' });

      if (error) throw error;
      toast.success(`${selectedMonth}の目標を保存しました！`);
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
    <div className="space-y-6 animate-fade-in pb-32 px-4">
      {/* ヘッダー */}
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-accent-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-accent-primary">
          <Settings className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-dark-100">アプリ設定</h1>
        <p className="text-sm text-dark-500 mt-1">目標値の管理・システム設定</p>
      </div>

      {/* 月間目標設定 */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-dark-700 pb-4">
          <Target className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-bold text-dark-100">月間目標の設定</h2>
        </div>

        {/* 月選択 */}
        <div className="flex items-center justify-between bg-dark-700/50 p-2 rounded-xl">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:text-accent-primary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-400" />
            <span className="font-bold text-lg">{selectedMonth.replace('-', '年')}月</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:text-accent-primary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {fetching ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-dark-600" /></div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">売上目標 (千円)</label>
              <div className="relative flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={goalData.target_amount}
                    onChange={(e) => setGoalData({ ...goalData, target_amount: Number(e.target.value) })}
                    className="input-premium px-4 w-full"
                  />
                </div>
                <span className="text-xs font-bold text-dark-400 opacity-50">約{formatNumber(goalData.target_amount * 1000)}円</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">ポイント目標</label>
              <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="number"
                  value={goalData.target_points}
                  onChange={(e) => setGoalData({ ...goalData, target_points: Number(e.target.value) })}
                  className="input-premium pl-12"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full h-14 text-lg font-bold shadow-glow mt-4 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> 設定を保存する</>}
            </button>
          </div>
        )}
      </div>

      {/* その他情報 */}
      <div className="card p-5 opacity-60">
        <h3 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-2">システム情報</h3>
        <div className="space-y-1 text-[10px] text-dark-500 font-mono">
          <p>TimeZone: Asia/Tokyo (JST)</p>
          <p>Database: Supabase PostgreSQL</p>
          <p>Status: Ready</p>
        </div>
      </div>
    </div>
  );
}
