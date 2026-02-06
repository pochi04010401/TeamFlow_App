'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Loader2, Check, Edit2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fireConfetti } from '@/lib/utils';
import type { CalendarTask, Member, TaskStatus } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { TaskEditModal } from './TaskEditModal';
import { MemberFilter } from './MemberFilter';
import { toast } from 'sonner';

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

      // タスクを取得
      const query = supabase
        .from('tasks')
        .select('*, member:members(*)')
        .order('end_date', { ascending: true, nullsFirst: false })
        .order('start_date', { ascending: true, nullsFirst: false });
      
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
    if (selectedMemberId) {
      result = result.filter(t => t.member_id === selectedMemberId);
    }
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

  const isOverdue = (task: CalendarTask): boolean => {
    if (task.status === 'completed') return false;
    const endDate = task.end_date || task.scheduled_date;
    if (!endDate) return false;
    return endDate < formatDate(new Date());
  };

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
          <h3 className="text-lg font-medium text-dark-300 mb-2">該当するタスクはありません</h3>
          <p className="text-sm text-dark-500">条件を変更するか、新しいタスクを登録してください。</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-dark-400 px-1">
            {selectedMemberId ? `${members.find(m => m.id === selectedMemberId)?.name}の` : ''}
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
                  isCompleted ? 'opacity-70 grayscale-[0.3]' : overdue ? 'border-2 border-accent-danger/50' : dueToday ? 'border-2 border-accent-warning/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }} disabled={updatingTask === task.id} className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'border-accent-success bg-accent-success/20 text-accent-success' : updatingTask === task.id ? 'border-accent-primary bg-accent-primary/20' : 'border-dark-500 hover:border-accent-success hover:bg-accent-success/20 text-dark-500'}`}>
                    {updatingTask === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {task.member && <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: task.member.color }} />}
                      <h3 className={`font-medium truncate ${isCompleted ? 'text-dark-400 line-through' : 'text-dark-100'}`}>{task.title}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                      <span className={`font-medium ${isCompleted ? 'text-dark-500' : 'text-accent-success'}`}>{formatCurrency(task.amount)}</span>
                      <span>{task.points}pt</span>
                      {task.member && <span>{task.member.name}</span>}
                    </div>
                    <div className={`mt-2 text-xs ${isCompleted ? 'text-dark-500' : overdue ? 'text-accent-danger font-medium' : dueToday ? 'text-accent-warning font-medium' : 'text-dark-500'}`}>
                      {startDate === endDate ? <span>{startDate}</span> : <span>{startDate} 〜 {endDate}</span>}
                      {isCompleted && task.completed_at && <span className="ml-2 text-accent-success">✅ {formatDate(task.completed_at)} 完了</span>}
                    </div>
                  </div>
                  <Edit2 className="w-4 h-4 text-dark-500 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {editingTask && <TaskEditModal task={editingTask} members={members} onClose={() => setEditingTask(null)} onUpdate={fetchTasks} />}
    </>
  );
}
