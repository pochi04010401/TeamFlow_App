'use client';

import { useState } from 'react';
import { X, Trash2, Save, Loader2, Calendar, JapaneseYen, Zap, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getContrastColor } from '@/lib/utils';
import type { Member, CalendarTask } from '@/lib/types';
import { toast } from 'sonner';

export function TaskEditModal({ 
  task, 
  members, 
  onClose, 
  onUpdate 
}: { 
  task: CalendarTask; 
  members: Member[]; 
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    amount: task.amount / 1000, // v1.10: Show in k-yen
    points: task.points,
    member_id: task.member_id,
    start_date: task.start_date,
    end_date: task.end_date,
    status: task.status,
    notes: task.notes || ''
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // バリデーション
      if (formData.end_date < formData.start_date) {
        toast.error('終了日は開始日以降の日付にしてください');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          ...formData,
          amount: formData.amount * 1000, // v1.10: Save as raw yen
          scheduled_date: formData.start_date, // v1.8.3: Sync scheduled_date with start_date
          completed_at: formData.status === 'completed' ? (task.completed_at || new Date().toISOString()) : null
        })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('更新しました');
      onUpdate();
      onClose();
    } catch (err) {
      toast.error('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？')) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from('tasks').delete().eq('id', task.id);
      toast.success('削除しました');
      onUpdate();
      onClose();
    } catch (err) {
      toast.error('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card w-full max-w-lg p-6 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-dark-700 pb-4 sticky top-0 bg-dark-800 z-10">
          <h2 className="text-xl font-bold text-dark-100">タスク詳細・編集</h2>
          <button onClick={onClose} className="text-dark-500 hover:text-white p-1"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-4">
          {/* 案件名 */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">案件名</label>
            <input 
              className="input-premium" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="案件名を入力"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 売上 */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">売上 (千円)</label>
              <div className="relative">
                <input 
                  type="number" 
                  className="input-premium px-4" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
              </div>
            </div>
            {/* ポイント */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">ポイント</label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <select
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  className="input-premium pl-9 appearance-none"
                >
                  {[0, 10, 20, 30, 40, 50].map((pt) => (
                    <option key={pt} value={pt}>{pt} pt</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 担当者 */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">担当者</label>
            <select
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              className="input-premium appearance-none"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 開始日 */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">開始日</label>
              <input 
                type="date" 
                className="input-premium" 
                value={formData.start_date} 
                onChange={e => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            {/* 終了日 */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">終了日</label>
              <input 
                type="date" 
                className="input-premium" 
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          {/* メモ (v1.7) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-dark-500 tracking-widest ml-1">メモ</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-dark-500" />
              <textarea 
                className="input-premium pl-9 min-h-[100px] py-2 resize-none" 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="備考や詳細内容をメモできます"
              />
            </div>
          </div>

          {/* ステータス */}
          <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-dark-700">
            {(['pending', 'completed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFormData({...formData, status: s})}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  formData.status === s ? 'bg-accent-primary text-white shadow-glow-sm' : 'text-dark-500 hover:text-dark-200'
                }`}
              >
                {s === 'pending' ? '進行中' : '完了'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-dark-700 sticky bottom-0 bg-dark-800">
          <button 
            disabled={loading}
            onClick={handleDelete}
            className="p-3 rounded-xl bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 transition-colors"
            title="削除"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          <button 
            disabled={loading}
            onClick={handleUpdate}
            className="flex-1 btn-primary h-12 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> 変更を保存</>}
          </button>
        </div>
      </div>
    </div>
  );
}
