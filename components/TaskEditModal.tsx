'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Calendar, User, FileText, Coins, Zap, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { Member, Task, TaskFormData } from '@/lib/types';
import { toast } from 'sonner';

interface TaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskEditModal({ task, isOpen, onClose, onUpdated, onDeleted }: TaskEditModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: task.title,
    amount: task.amount,
    points: task.points,
    member_id: task.member_id,
    start_date: task.start_date || task.scheduled_date || formatDate(new Date()),
    end_date: task.end_date || task.scheduled_date || formatDate(new Date()),
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: task.title,
        amount: task.amount,
        points: task.points,
        member_id: task.member_id,
        start_date: task.start_date || task.scheduled_date || formatDate(new Date()),
        end_date: task.end_date || task.scheduled_date || formatDate(new Date()),
      });
      fetchMembers();
    }
  }, [isOpen, task]);

  const fetchMembers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Fetch members error:', err);
      toast.error('メンバーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('案件名を入力してください');
      return;
    }

    if (!formData.member_id) {
      toast.error('担当者を選択してください');
      return;
    }

    if (formData.start_date > formData.end_date) {
      toast.error('開始日は終了日より前にしてください');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: formData.title.trim(),
          amount: formData.amount,
          points: formData.points,
          member_id: formData.member_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          scheduled_date: formData.start_date, // 後方互換性
        })
        .eq('id', task.id)
        .select('*, member:members(*)')
        .single();

      if (error) throw error;

      toast.success('タスクを更新しました');
      onUpdated(data as Task);
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このタスクを削除しますか？')) return;

    setDeleting(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast.success('タスクを削除しました');
      onDeleted(task.id);
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-dark-800 rounded-2xl shadow-xl animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 p-4 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-100">タスク編集</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* 案件名 */}
            <div>
              <label className="label flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-primary" />
                案件名
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="例：○○社 コンサルティング"
                className="input"
                required
              />
            </div>

            {/* 金額・ポイント */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  <Coins className="w-4 h-4 text-accent-success" />
                  金額（円）
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent-secondary" />
                  ポイント
                </label>
                <input
                  type="number"
                  name="points"
                  value={formData.points || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                />
              </div>
            </div>

            {/* 担当者 */}
            <div>
              <label className="label flex items-center gap-2">
                <User className="w-4 h-4 text-accent-primary" />
                担当者
              </label>
              <div className="grid grid-cols-4 gap-2">
                {members.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, member_id: member.id }))}
                    className={`p-2 rounded-xl border-2 transition-all duration-200 ${
                      formData.member_id === member.id
                        ? 'border-accent-primary bg-accent-primary/20'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: member.color }}
                    />
                    <p className="text-xs text-dark-300 truncate">{member.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 開始日・終了日 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent-primary" />
                  開始日
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent-warning" />
                  終了日
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            {/* ステータス表示 */}
            <div className="p-3 rounded-lg bg-dark-700/50">
              <p className="text-sm text-dark-400">
                ステータス: 
                <span className={`ml-2 font-medium ${
                  task.status === 'completed' ? 'text-accent-success' :
                  task.status === 'cancelled' ? 'text-accent-danger' :
                  'text-accent-warning'
                }`}>
                  {task.status === 'completed' ? '完了' :
                   task.status === 'cancelled' ? 'キャンセル' : '進行中'}
                </span>
              </p>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || submitting}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 !bg-accent-danger/20 !border-accent-danger/50 hover:!bg-accent-danger/30"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    削除
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={submitting || deleting}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    保存
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
