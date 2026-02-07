'use client';

import { useState } from 'react';
import { 
  X, 
  Trash2, 
  Save, 
  Loader2, 
  Calendar, 
  Zap, 
  FileText, 
  Check, 
  ArrowRight,
  Clock,
  Layout
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getContrastColor, formatNumber } from '@/lib/utils';
import type { Member, CalendarTask } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    amount: task.amount / 1000,
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
      
      if (formData.end_date < formData.start_date) {
        toast.error('終了日は開始日以降の日付にしてください');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          ...formData,
          amount: formData.amount * 1000,
          scheduled_date: formData.start_date,
          completed_at: formData.status === 'completed' ? (task.completed_at || new Date().toISOString()) : null
        })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('更新しました');
      onUpdate();
      router.refresh();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
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
      
      // v1.48: 物理削除から論理削除（status='deleted'）に変更
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'deleted' })
        .eq('id', task.id);

      if (error) {
        // もしDBの制約で'deleted'が使えない場合は'cancelled'で代用（念のため）
        if (error.code === '23514') {
          const { error: retryError } = await supabase
            .from('tasks')
            .update({ status: 'cancelled' })
            .eq('id', task.id);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      toast.success('削除として登録しました');
      onUpdate();
      router.refresh();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      const message = err instanceof Error ? err.message : '削除に失敗しました';
      toast.error(`削除に失敗しました: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-dark-700 animate-in zoom-in-95 duration-300">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700 bg-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent-primary/20 text-accent-primary">
              <Layout className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-dark-100">タスク詳細</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-dark-600">
          
          {/* 1. タイトル & ステータス */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-dark-500 tracking-widest ml-1">案件タイトル</label>
              <input 
                className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl px-5 py-4 text-dark-100 font-bold focus:border-accent-primary transition-all outline-none" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="flex gap-2 p-1 bg-dark-900 rounded-xl border border-dark-700">
              {(['pending', 'completed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFormData({...formData, status: s})}
                  className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${
                    formData.status === s 
                      ? 'bg-accent-primary text-white shadow-glow-sm' 
                      : 'text-dark-500 hover:text-dark-200'
                  }`}
                >
                  {s === 'pending' ? '進行中' : '完了'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 担当者 */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-dark-500 tracking-widest ml-1">担当メンバー</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {members.map((member) => {
                const isSelected = formData.member_id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, member_id: member.id })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? 'border-accent-primary bg-accent-primary/10' 
                        : 'border-dark-700 bg-dark-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: member.color }}>
                      {isSelected && <Check className="w-4 h-4" style={{ color: getContrastColor(member.color) }} />}
                    </div>
                    <span className={`text-[10px] font-black truncate w-full text-center ${isSelected ? 'text-dark-100' : 'text-dark-500'}`}>{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 売上 & ポイント */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-dark-500 tracking-widest ml-1">売上</label>
              <div className="relative flex items-center gap-2">
                <input 
                  type="number" 
                  className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl px-5 py-4 text-dark-100 font-black focus:border-accent-success transition-all outline-none" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                />
                <span className="text-sm font-bold text-dark-400 bg-dark-700 px-3 py-4 rounded-xl">千円</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-dark-500 tracking-widest ml-1">ポイント</label>
              <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-warning" />
                <select
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl pl-12 pr-4 py-4 text-dark-100 font-black focus:border-accent-warning transition-all outline-none appearance-none"
                >
                  {[0, 10, 20, 30, 40, 50].map((pt) => (
                    <option key={pt} value={pt}>{pt} pt</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. スケジュール */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-dark-500 tracking-widest ml-1">期間設定</label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input 
                type="date" 
                className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl px-4 py-4 text-dark-100 font-bold focus:border-blue-500 outline-none" 
                value={formData.start_date} 
                onChange={e => setFormData({...formData, start_date: e.target.value})}
              />
              <ArrowRight className="w-4 h-4 text-dark-600 hidden sm:block" />
              <input 
                type="date" 
                className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl px-4 py-4 text-dark-100 font-bold focus:border-blue-500 outline-none" 
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          {/* 5. メモ */}
          <div className="space-y-1 pb-4">
            <label className="text-[10px] font-black uppercase text-dark-500 tracking-widest ml-1">メモ (備考)</label>
            <textarea 
              className="w-full bg-dark-900 border-2 border-dark-700 rounded-2xl px-5 py-4 min-h-[100px] text-dark-200 font-medium focus:border-dark-500 transition-all outline-none resize-none" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="詳細な作業内容など..."
            />
          </div>
        </div>

        {/* フッターアクション */}
        <div className="p-6 border-t border-dark-700 bg-dark-800/50 flex gap-3">
          <button 
            disabled={loading}
            onClick={handleDelete}
            className="p-4 rounded-2xl bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 transition-all active:scale-95"
            title="削除"
          >
            <Trash2 className="w-6 h-6" />
          </button>
          <button 
            disabled={loading}
            onClick={handleUpdate}
            className="flex-1 btn-primary h-16 flex items-center justify-center gap-3 text-lg font-black shadow-glow"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> 変更を保存する</>}
          </button>
        </div>
      </div>
    </div>
  );
}
