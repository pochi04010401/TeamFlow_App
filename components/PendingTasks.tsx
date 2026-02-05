'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Loader2, Check, Edit2, Users, ChevronDown, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fireConfetti } from '@/lib/utils';
import type { CalendarTask, Member, TaskStatus } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { TaskEditModal } from './TaskEditModal';
import { toast } from 'sonner';

// メンバー選択ドロップダウン (v1.2)
function MemberFilter({
  members,
  selectedMemberId,
  onSelect
}: {
  members: Member[];
  selectedMemberId: string | null;
  onSelect: (memberId: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50 hover:bg-dark-600/50 transition-colors"
      >
        {selectedMember ? (
          <>
            <div 
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: selectedMember.color }}
            />
            <span className="text-sm text-dark-200">{selectedMember.name}</span>
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-300">全員</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-dark-700 rounded-xl shadow-lg border border-dark-600 z-50 overflow-hidden">
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors ${
                !selectedMemberId ? 'bg-accent-primary/20' : ''
              }`}
            >
              <Users className="w-5 h-5 text-dark-400" />
              <span className="text-sm text-dark-200">全員</span>
            </button>
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => {
                  onSelect(member.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-600 transition-colors ${
                  selectedMemberId === member.id ? 'bg-accent-primary/20' : ''
                }`}
              >
                <div 
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-sm text-dark-200">{member.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ステータスフィルタ (v1.5)
function StatusFilter({
  status,
  onSelect
}: {
  status: TaskStatus | 'all';
  onSelect: (status: TaskStatus | 'all') => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-dark-700/50 rounded-lg">
      <button
        onClick={() => onSelect('pending')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
          status === 'pending' ? 'bg-accent-primary text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
        }`}
      >
        進行中
      </button>
      <button
        onClick={() => onSelect('completed')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
          status === 'completed' ? 'bg-accent-success text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
        }`}
      >
        完了
      </button>
      <button
        onClick={() => onSelect('all')}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
          status === 'all' ? 'bg-dark-600 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'
        }`}
      >
        全て
      </button>
    </div>
  );
}

export function PendingTasks() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('pending');

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // メンバーを取得
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('created_at');

      if (membersError) throw membersError;

      // タスクを取得（フィルタリングはクライアント側で行うが、
      // パフォーマンスのため pending と completed だけを取得対象にする）
      const query = supabase
        .from('tasks')
        .select('*, member:members(*)')
        .order('end_date', { ascending: true, nullsFirst: false })
        .order('start_date', { ascending: true, nullsFirst: false });
      
      // statusFilterが 'all' でない場合は初期取得を絞る（任意）
      // 今回は柔軟に切り替えられるよう全件（cancelled以外）取得する
      const { data, error: fetchError } = await query.in('status', ['pending', 'completed']);

      if (fetchError) throw fetchError;

      setMembers(membersData || []);
      setTasks(data as CalendarTask[] || []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // フィルタリングされたタスク (v1.5)
  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // メンバーフィルタ
    if (selectedMemberId) {
      result = result.filter(t => t.member_id === selectedMemberId);
    }
    
    // ステータスフィルタ
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }
    
    return result;
  }, [tasks, selectedMemberId, statusFilter]);

  const handleToggleStatus = async (task: CalendarTask) => {
    if (updatingTask === task.id) return;

    setUpdatingTask(task.id);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;

      // 状態更新
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      ));

      if (newStatus === 'completed') {
        await fireConfetti();
        toast.success('タスクを完了しました！');
      } else {
        toast('タスクを進行中に戻しました');
      }
    } catch (err) {
      console.error('Update task error:', err);
      toast.error('更新に失敗しました');
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleTaskClick = (task: CalendarTask) => {
    setEditingTask(task);
  };

  // 期限切れかどうかチェック
  const isOverdue = (task: CalendarTask): boolean => {
    if (task.status === 'completed') return false;
    const endDate = task.end_date || task.scheduled_date;
    if (!endDate) return false;
    return endDate < formatDate(new Date());
  };

  // 今日が期限かどうかチェック
  const isDueToday = (task: CalendarTask): boolean => {
    if (task.status === 'completed') return false;
    const endDate = task.end_date || task.scheduled_date;
    if (!endDate) return false;
    return endDate === formatDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchTasks} />;
  }

  return (
    <>
      {/* フィルタセクション (v1.5) */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-3">
          <MemberFilter
            members={members}
            selectedMemberId={selectedMemberId}
            onSelect={setSelectedMemberId}
          />
          <StatusFilter
            status={statusFilter}
            onSelect={setStatusFilter}
          />
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card p-8 text-center">
          <Clock className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">
            該当するタスクはありません
          </h3>
          <p className="text-sm text-dark-500">
            フィルタ条件を変更するか、新しいタスクを登録してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {/* タスク数表示 */}
          <p className="text-sm text-dark-400 px-1">
            {selectedMemberId 
              ? `${members.find(m => m.id === selectedMemberId)?.name}の`
              : ''
            }
            {statusFilter === 'pending' ? '進行中' : statusFilter === 'completed' ? '完了済み' : '全て'}
            のタスク: {filteredTasks.length}件
          </p>

          {filteredTasks.map(task => {
            const overdue = isOverdue(task);
            const dueToday = isDueToday(task);
            const isCompleted = task.status === 'completed';
            const startDate = task.start_date || task.scheduled_date || '';
            const endDate = task.end_date || task.scheduled_date || '';

            return (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`card p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                  isCompleted ? 'opacity-70 grayscale-[0.3]' : 
                  overdue ? 'border-2 border-accent-danger/50' : 
                  dueToday ? 'border-2 border-accent-warning/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* ステータス切替ボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(task);
                    }}
                    disabled={updatingTask === task.id}
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'border-accent-success bg-accent-success/20 text-accent-success'
                        : updatingTask === task.id
                        ? 'border-accent-primary bg-accent-primary/20'
                        : 'border-dark-500 hover:border-accent-success hover:bg-accent-success/20 text-dark-500'
                    }`}
                  >
                    {updatingTask === task.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>

                  {/* タスク情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {task.member && (
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: task.member.color }}
                          title={task.member.name}
                        />
                      )}
                      <h3 className={`font-medium truncate ${isCompleted ? 'text-dark-400 line-through' : 'text-dark-100'}`}>
                        {task.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <span className={`font-medium ${isCompleted ? 'text-dark-500' : 'text-accent-success'}`}>
                        {formatCurrency(task.amount)}
                      </span>
                      <span>{task.points}pt</span>
                      {task.member && (
                        <span>{task.member.name}</span>
                      )}
                    </div>

                    {/* 期間表示 */}
                    <div className={`mt-2 text-xs ${
                      isCompleted ? 'text-dark-500' :
                      overdue ? 'text-accent-danger font-medium' : 
                      dueToday ? 'text-accent-warning font-medium' : 'text-dark-500'
                    }`}>
                      {startDate === endDate ? (
                        <span>{startDate}</span>
                      ) : (
                        <span>{startDate} 〜 {endDate}</span>
                      )}
                      {!isCompleted && overdue && <span className="ml-2">⚠️ 期限切れ</span>}
                      {!isCompleted && dueToday && !overdue && <span className="ml-2">📅 本日期限</span>}
                      {isCompleted && task.completed_at && (
                        <span className="ml-2 text-accent-success">✅ {formatDate(task.completed_at)} 完了</span>
                      )}
                    </div>
                  </div>

                  {/* 編集アイコン */}
                  <Edit2 className="w-4 h-4 text-dark-500 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 編集モーダル */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          members={members}
          onClose={() => setEditingTask(null)}
          onUpdate={fetchTasks}
        />
      )}
    </>
  );
}
