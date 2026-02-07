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
  Coins, 
  Clock,
  ArrowRight,
  Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentDate, formatNumber, getContrastColor } from '@/lib/utils';
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

  // 常に今日の日付をデフォルトにする
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
      console.error('Registration error:', err);
      toast.error('登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find(m => m.id === formData.member_id);

  return (
    <div className="animate-fade-in pb-12 px-4 max-w-lg mx-auto">
      {/* ヒーローセクション */}
      <div className="relative py-8 text-center overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-accent-primary/20 to-transparent border border-accent-primary/10">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-accent-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-dark-100 tracking-tight">新規タスクの作成</h1>
          <p className="text-sm text-dark-400 mt-2 font-medium">案件の詳細を入力して登録しましょう</p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-accent-primary/10 rounded-full blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* セクション1: 基本情報 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-1.5 h-4 bg-accent-primary rounded-full" />
            <h2 className="text-xs font-black text-dark-300 uppercase tracking-widest">基本情報</h2>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-dark-500 uppercase ml-1">案件タイトル</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例: プロジェクトA 打ち合わせ"
              className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-4 text-dark-100 font-bold focus:border-accent-primary transition-all outline-none text-lg placeholder:text-dark-600"
            />
          </div>
        </div>

        {/* セクション2: 担当者選択 (リッチピッカー) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-1.5 h-4 bg-accent-secondary rounded-full" />
            <h2 className="text-xs font-black text-dark-300 uppercase tracking-widest">担当メンバー</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {members.map((member) => {
              const isSelected = formData.member_id === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, member_id: member.id })}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    isSelected 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {isSelected && <Check className="w-5 h-5" style={{ color: getContrastColor(member.color) }} />}
                  </div>
                  <span className={`text-[10px] font-black truncate w-full text-center ${isSelected ? 'text-dark-100' : 'text-dark-400'}`}>
                    {member.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* セクション3: 数値・スコア */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <div className="w-1.5 h-4 bg-accent-success rounded-full" />
              <h2 className="text-xs font-black text-dark-300 uppercase tracking-widest">売上予定</h2>
            </div>
            <div className="relative group">
              <input
                type="number"
                inputMode="numeric"
                value={formData.amountStr}
                onChange={(e) => setFormData({ ...formData, amountStr: e.target.value })}
                placeholder="0"
                className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-6 pr-16 py-4 text-dark-100 font-black text-xl focus:border-accent-success transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-dark-700 rounded-lg text-[10px] font-black text-dark-400 border border-dark-600">
                千円
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <div className="w-1.5 h-4 bg-accent-warning rounded-full" />
              <h2 className="text-xs font-black text-dark-300 uppercase tracking-widest">ポイント</h2>
            </div>
            <div className="relative">
              <select
                required
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl pl-12 pr-6 py-4 text-dark-100 font-black text-xl focus:border-accent-warning transition-all outline-none appearance-none"
              >
                {[0, 10, 20, 30, 40, 50].map((pt) => (
                  <option key={pt} value={pt}>{pt} pt</option>
                ))}
              </select>
              <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-warning" />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* セクション4: 期間 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
            <h2 className="text-xs font-black text-dark-300 uppercase tracking-widest">スケジュール</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value, end_date: e.target.value > formData.end_date ? e.target.value : formData.end_date })}
                className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-4 text-dark-100 font-bold focus:border-blue-500 transition-all outline-none"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
            </div>
            <ArrowRight className="w-5 h-5 text-dark-600 hidden sm:block" />
            <div className="relative w-full">
              <input
                type="date"
                required
                value={formData.end_date}
                min={formData.start_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-4 text-dark-100 font-bold focus:border-blue-500 transition-all outline-none"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* セクション5: メモ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <div className="w-1.5 h-4 bg-dark-400 rounded-full" />
            <h2 className="text-xs font-black text-dark-300 uppercase tracking-widest">メモ (オプション)</h2>
          </div>
          <div className="relative">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="作業の補足や共有事項など..."
              className="w-full bg-dark-800 border-2 border-dark-700 rounded-2xl px-6 py-4 min-h-[120px] text-dark-100 font-medium focus:border-dark-500 transition-all outline-none resize-none placeholder:text-dark-600"
            />
            <FileText className="absolute right-4 bottom-4 w-5 h-5 text-dark-700 pointer-events-none" />
          </div>
        </div>

        {/* 登録ボタン */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-20 bg-gradient-premium rounded-3xl text-white font-black text-xl shadow-glow hover:scale-[0.98] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              タスクを登録
              <PlusCircle className="w-6 h-6" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
