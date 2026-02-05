'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Calendar, JapaneseYen, Zap, User, Loader2, ChevronDown, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentDate } from '@/lib/utils';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // バリデーション (v1.6)
      if (formData.end_date < formData.start_date) {
        toast.error('終了日は開始日以降の日付にしてください');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title,
          amount: formData.amountStr === '' ? 0 : Number(formData.amountStr),
          points: formData.points,
          member_id: formData.member_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          notes: formData.notes,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('タスクを登録しました！', {
        description: formData.title,
      });
      
      // 入力リセット
      setFormData({
        ...formData,
        title: '',
        amountStr: '',
        points: 0,
        notes: ''
      });

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="text-center mb-8 px-4">
        <h1 className="text-2xl font-black text-dark-100 tracking-tight">新規タスク登録</h1>
        <p className="text-sm text-dark-500 mt-1">案件と売上予定を記録しましょう</p>
      </div>

      <div className="card p-6 mx-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 案件名 */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">案件名</label>
            <div className="relative group">
              <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-accent-primary transition-colors" />
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="プロジェクト名や作業内容"
                className="input-premium pl-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 売上金額 */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">売上予定 (千円)</label>
              <div className="relative group">
                <JapaneseYen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-accent-success transition-colors" />
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.amountStr}
                  onChange={(e) => setFormData({ ...formData, amountStr: e.target.value })}
                  placeholder="50"
                  className="input-premium pl-12"
                />
              </div>
            </div>

            {/* ポイント */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">ポイント</label>
              <div className="relative group">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-accent-secondary transition-colors" />
                <select
                  required
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  className="input-premium pl-12 appearance-none"
                >
                  {[0, 10, 20, 30, 40, 50].map((pt) => (
                    <option key={pt} value={pt}>
                      {pt} pt
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-dark-500" />
                </div>
              </div>
            </div>
          </div>

          {/* 担当者 */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">担当者</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 group-focus-within:text-accent-primary transition-colors" />
              <select
                required
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                className="input-premium pl-12 appearance-none"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 開始日 */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">開始日</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value > formData.end_date ? e.target.value : formData.end_date })}
                  className="input-premium pl-12"
                />
              </div>
            </div>

            {/* 終了日 */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">終了日</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  min={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-premium pl-12"
                />
              </div>
            </div>
          </div>

          {/* メモ (v1.7) */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-dark-500 tracking-widest ml-1">メモ</label>
            <div className="relative group">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-dark-500" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="備考や詳細内容"
                className="input-premium pl-12 min-h-[100px] py-3 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-14 text-lg font-bold shadow-glow mt-4 flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>登録する 🚀</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
