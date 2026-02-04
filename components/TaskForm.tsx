'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Calendar, User, FileText, Coins, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, fireConfetti } from '@/lib/utils';
import type { Member, TaskFormData } from '@/lib/types';
import { toast } from 'sonner';

export function TaskForm() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    amount: 0,
    points: 0,
    member_id: '',
    start_date: formatDate(new Date()),
    end_date: formatDate(new Date()),
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('created_at');

        if (error) throw error;

        setMembers(data || []);
        // 最初のメンバーを初期選択
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, member_id: data[0].id }));
        }
      } catch (err) {
        console.error('Fetch members error:', err);
        toast.error('メンバーの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

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
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: formData.title.trim(),
          amount: formData.amount,
          points: formData.points,
          member_id: formData.member_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          scheduled_date: formData.start_date, // 後方互換性
          status: 'pending',
        });

      if (error) throw error;

      // 成功時の処理
      await fireConfetti();
      toast.success('タスクを登録しました！');

      // フォームをリセット
      setFormData({
        title: '',
        amount: 0,
        points: 0,
        member_id: members[0]?.id || '',
        start_date: formatDate(new Date()),
        end_date: formatDate(new Date()),
      });

      // ダッシュボードに遷移
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('登録に失敗しました');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* 案件名 */}
      <div className="card p-5">
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
        <div className="card p-5">
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

        <div className="card p-5">
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
      <div className="card p-5">
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
              className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                formData.member_id === member.id
                  ? 'border-accent-primary bg-accent-primary/20'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <div 
                className="w-8 h-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: member.color }}
              />
              <p className="text-xs text-dark-300 truncate">{member.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 開始日・終了日 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
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

        <div className="card p-5">
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

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            登録中...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            タスクを登録
          </>
        )}
      </button>
    </form>
  );
}
