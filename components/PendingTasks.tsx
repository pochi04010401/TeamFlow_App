'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, Check, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fireConfetti, getContrastColor } from '@/lib/utils';
import type { Task, CalendarTask, Member } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { TaskEditModal } from './TaskEditModal';
import { toast } from 'sonner';

export function PendingTasks() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);

  const fetchPendingTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .eq('status', 'pending')
        .order('end_date', { ascending: true, nullsFirst: false })
        .order('start_date', { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;

      setTasks(data as CalendarTask[] || []);
    } catch (err) {
      console.error('Fetch pending tasks error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const handleCompleteTask = async (task: CalendarTask) => {
    if (updatingTask === task.id) return;

    setUpdatingTask(task.id);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      // 成功時の処理 - リストから削除
      setTasks(prev => prev.filter(t => t.id !== task.id));

      // 紙吹雪を発射
      await fireConfetti();
      
      toast.success('タスクを完了しました！', {
        description: task.title,
      });
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

  const handleTaskUpdated = (updatedTask: Task) => {
    if (updatedTask.status !== 'pending') {
      // ステータスが変わった場合はリストから削除
      setTasks(prev => prev.filter(t => t.id !== updatedTask.id));
    } else {
      setTasks(prev => prev.map(t => 
        t.id === updatedTask.id ? updatedTask as CalendarTask : t
      ));
    }
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // 期限切れかどうかチェック
  const isOverdue = (task: CalendarTask): boolean => {
    const endDate = task.end_date || task.scheduled_date;
    if (!endDate) return false;
    return endDate < formatDate(new Date());
  };

  // 今日が期限かどうかチェック
  const isDueToday = (task: CalendarTask): boolean => {
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
    return <ErrorDisplay message={error} onRetry={fetchPendingTasks} />;
  }

  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Clock className="w-12 h-12 text-dark-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-dark-300 mb-2">
          進行中のタスクはありません
        </h3>
        <p className="text-sm text-dark-500">
          全てのタスクが完了しています！お疲れ様でした。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 animate-fade-in">
        {tasks.map(task => {
          const overdue = isOverdue(task);
          const dueToday = isDueToday(task);
          const startDate = task.start_date || task.scheduled_date || '';
          const endDate = task.end_date || task.scheduled_date || '';

          return (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`card p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                overdue ? 'border-2 border-accent-danger/50' : 
                dueToday ? 'border-2 border-accent-warning/50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* 完了ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteTask(task);
                  }}
                  disabled={updatingTask === task.id}
                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    updatingTask === task.id
                      ? 'border-accent-primary bg-accent-primary/20'
                      : 'border-dark-500 hover:border-accent-success hover:bg-accent-success/20'
                  }`}
                >
                  {updatingTask === task.id ? (
                    <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-dark-500" />
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
                    <h3 className="font-medium text-dark-100 truncate">
                      {task.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    <span className="font-medium text-accent-success">
                      {formatCurrency(task.amount)}
                    </span>
                    <span>{task.points}pt</span>
                    {task.member && (
                      <span>{task.member.name}</span>
                    )}
                  </div>

                  {/* 期間表示 */}
                  <div className={`mt-2 text-xs ${
                    overdue ? 'text-accent-danger font-medium' : 
                    dueToday ? 'text-accent-warning font-medium' : 'text-dark-500'
                  }`}>
                    {startDate === endDate ? (
                      <span>{startDate}</span>
                    ) : (
                      <span>{startDate} 〜 {endDate}</span>
                    )}
                    {overdue && <span className="ml-2">⚠️ 期限切れ</span>}
                    {dueToday && !overdue && <span className="ml-2">📅 本日期限</span>}
                  </div>
                </div>

                {/* 編集アイコン */}
                <Edit2 className="w-4 h-4 text-dark-500 flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 編集モーダル */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </>
  );
}
