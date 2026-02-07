'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusCircle, 
  Calendar, 
  Zap, 
  User, 
  Loader2, 
  ChevronDown, 
  FileText, 
  Check,
  ArrowRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentDate, getContrastColor } from '@/lib/utils';
import type { Member, TaskFormData } from '@/lib/types';
import { toast } from 'sonner';

export function TaskForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData & { amountStr: string }>({
    title: '',
    amount: 0,
    amountStr: '',
    points: 0,
    member_id: members[0]?.id || '',
    start_date: getCurrentDate(),
    end_date: getCurrentDate(),
    notes: ''
  });

  useEffect(() => {
    const today = getCurrentDate();
    setFormData(prev => ({
      ...prev,
      start_date: today,
      end_date: prev.end_date < today ? today : prev.end_date
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error('案件名を入力してください');
    
    setLoading(true);

    try {
      const supabase = createClient();
      if (formData.end_date < formData.start_date) {
        toast.error('終了日は開始日以降の日付にしてください');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          amount: (formData.amountStr === '' ? 0 : Number(formData.amountStr)) * 1000,
          points: formData.points,
          member_id: formData.member_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          scheduled_date: formData.start_date,
          notes: formData.notes,
          status: 'pending'
        }]);

      if (error) throw error;
      toast.success('タスクを登録しました！');
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-12 px-2 max-w-lg mx-auto w-full">
      {/* ヒーロー */}
      <div className="relative py-10 text-center overflow-hidden rounded-[2.5rem] mb-10 bg-gradient-to-br from-accent-primary/25 via-accent-primary/5 to-transparent border border-accent-primary/20 shadow-glow-sm">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-accent-primary rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-glow">
            <PlusCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-dark-100 tracking-tighter">新規タスク登録</h1>
          <p className="text-sm text-dark-400 mt-2 font-bold tracking-wide">新しい案件をチームに共有しましょう</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1),transparent_70%)]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 w-full">
        
        {/* 1. タイトル */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-2 h-5 bg-accent-primary rounded-full shadow-glow-sm" />
            <h2 className="text-xs font-black text-dark-200 uppercase tracking-[0.2em]">基本情報</h2>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1">案件名</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="プロジェクト名やクライアント名"
              className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-5 text-dark-100 font-bold focus:border-accent-primary transition-all outline-none text-xl shadow-inner-dark"
            />
          </div>
        </div>

        {/* 2. 担当者 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-2 h-5 bg-accent-secondary rounded-full" />
            <h2 className="text-xs font-black text-dark-200 uppercase tracking-[0.2em]">担当メンバー</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {members.map((member) => {
              const isSelected = formData.member_id === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, member_id: member.id })}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected ? 'border-accent-primary bg-accent-primary/10 shadow-glow-sm' : 'border-dark-700 bg-dark-800 hover:border-dark-500'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full shadow-lg border-2 border-white/10" style={{ backgroundColor: member.color }} />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center border-2 border-dark-800 animate-in zoom-in-50">
                        <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] font-black truncate w-full text-center ${isSelected ? 'text-dark-100' : 'text-dark-500 group-hover:text-dark-300'}`}>
                    {member.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 売上 & ポイント */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-2 h-5 bg-accent-success rounded-full" />
            <h2 className="text-xs font-black text-dark-200 uppercase tracking-[0.2em]">報酬・評価</h2>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1">売上予定</label>
              <div className="relative w-full group">
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.amountStr}
                  onChange={(e) => setFormData({ ...formData, amountStr: e.target.value })}
                  placeholder="0"
                  className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-6 pr-20 py-5 text-dark-100 font-black text-2xl focus:border-accent-success outline-none transition-all shadow-inner-dark"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-10 px-4 flex items-center bg-dark-700 border border-dark-600 rounded-xl text-xs font-black text-dark-300 pointer-events-none group-focus-within:border-accent-success/50 transition-colors">
                  千円
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1">獲得ポイント</label>
              <div className="relative w-full group">
                <select
                  required
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-14 pr-10 py-5 text-dark-100 font-black text-2xl focus:border-accent-warning outline-none appearance-none transition-all shadow-inner-dark"
                >
                  {[0, 10, 20, 30, 40, 50].map((pt) => <option key={pt} value={pt}>{pt} pt</option>)}
                </select>
                <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-accent-warning" />
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-500 pointer-events-none group-focus-within:text-accent-warning transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. スケジュール */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-2 h-5 bg-blue-500 rounded-full" />
            <h2 className="text-xs font-black text-dark-200 uppercase tracking-[0.2em]">スケジュール</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1 text-accent-primary">開始日</label>
              <div className="relative group">
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value > formData.end_date ? e.target.value : formData.end_date })}
                  className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-5 text-dark-100 font-bold focus:border-blue-500 outline-none transition-all shadow-inner-dark"
                />
                <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1 text-accent-secondary">終了日</label>
              <div className="relative group">
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  min={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-5 text-dark-100 font-bold focus:border-blue-500 outline-none transition-all shadow-inner-dark"
                />
                <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* 5. メモ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-2 h-5 bg-dark-500 rounded-full" />
            <h2 className="text-xs font-black text-dark-200 uppercase tracking-[0.2em]">メモ (オプション)</h2>
          </div>
          <div className="relative group">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="具体的な内容や進め方、特記事項など..."
              className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-5 min-h-[140px] text-dark-100 font-medium focus:border-dark-400 outline-none transition-all resize-none shadow-inner-dark placeholder:text-dark-600"
            />
            <FileText className="absolute right-6 bottom-6 w-6 h-6 text-dark-700 pointer-events-none group-focus-within:text-dark-500 transition-colors" />
          </div>
        </div>

        {/* 登録ボタン */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full h-24 bg-gradient-premium rounded-[2rem] text-white font-black text-2xl shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:scale-100"
          >
            <div className="flex items-center justify-center gap-4">
              {loading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <>
                  <span className="tracking-widest">タスクを登録</span>
                  <PlusCircle className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500" />
                </>
              )}
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}
