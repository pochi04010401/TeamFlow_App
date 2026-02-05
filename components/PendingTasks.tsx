'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Loader2, Check, Edit2, Users, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, fireConfetti, getContrastColor } from '@/lib/utils';
import type { Task, CalendarTask, Member } from '@/lib/types';
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

export function PendingTasks() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const fetchPendingTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // メンバーを取得 (v1.2)
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('created_at');

      if (membersError) throw membersError;

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .eq('status', 'pending')
        .order('end_date', { ascending: true, nullsFirst: false })
        .order('start_date', { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;

      setMembers(membersData || []);
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

  // フィルタリングされたタスク (v1.2)
  const filteredTasks = useMemo(() => {
    if (!selectedMemberId) return tasks;
    return tasks.filter(t => t.member_id === selectedMemberId);
  }, [tasks, selectedMemberId]);

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

  return (
    <>
      {/* メンバーフィルタ (v1.2) */}
      <div className="mb-4">
        <MemberFilter
          members={members}
          selectedMemberId={selectedMemberId}
          onSelect={setSelectedMemberId}
        />
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card p-8 text-center">
          <Clock className="w-12 h-12 text-dark-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">
            {selectedMemberId ? 'この担当者の進行中タスクはありません' : '進行中のタスクはありません'}
          </h3>
          <p className="text-sm text-dark-500">
            {selectedMemberId ? '他の担当者を選択するか、「全員」で全体を確認してください。' : '全てのタスクが完了しています！お疲れ様でした。'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {/* タスク数表示 */}
          <p className="text-sm text-dark-400 px-1">
            {selectedMemberId 
              ? `${members.find(m => m.id === selectedMemberId)?.name}のタスク: ${filteredTasks.length}件`
              : `全体: ${filteredTasks.length}件`
            }
          </p>

          {filteredTasks.map(task => {
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
      )}

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
