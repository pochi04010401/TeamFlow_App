'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  formatDate, 
  getDayOfWeek, 
  isToday, 
  getContrastColor,
  fireConfetti
} from '@/lib/utils';
import type { Member, Task, CalendarTask } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { TaskEditModal } from './TaskEditModal';
import { toast } from 'sonner';

export function TeamCalendar() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
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

      // 月のタスクを取得 (start_date/end_date または scheduled_date)
      const startOfMonth = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentMonth.year, currentMonth.month, 0)
        .toISOString().split('T')[0];

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .or(`start_date.lte.${endOfMonth},scheduled_date.lte.${endOfMonth}`)
        .or(`end_date.gte.${startOfMonth},scheduled_date.gte.${startOfMonth}`)
        .order('start_date', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      setMembers(membersData || []);
      setTasks(tasksData as CalendarTask[] || []);
    } catch (err) {
      console.error('Calendar fetch error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  // 今日の位置にスクロール
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const today = new Date();
      if (today.getMonth() + 1 === currentMonth.month && 
          today.getFullYear() === currentMonth.year) {
        const todayRow = document.getElementById(`date-${formatDate(today)}`);
        if (todayRow) {
          todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [loading, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleCompleteTask = async (task: CalendarTask, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'completed' || updatingTask === task.id) return;

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

      // 成功時の処理
      setTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, status: 'completed', completed_at: new Date().toISOString() }
          : t
      ));

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
    setTasks(prev => prev.map(t => 
      t.id === updatedTask.id ? updatedTask as CalendarTask : t
    ));
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // タスクが特定の日付に表示されるべきかチェック
  const isTaskOnDate = (task: CalendarTask, dateStr: string): boolean => {
    const startDate = task.start_date || task.scheduled_date;
    const endDate = task.end_date || task.scheduled_date;
    
    if (!startDate || !endDate) return false;
    
    return dateStr >= startDate && dateStr <= endDate;
  };

  // 月の日付を生成
  const dates = Array.from(
    { length: new Date(currentMonth.year, currentMonth.month, 0).getDate() },
    (_, i) => new Date(currentMonth.year, currentMonth.month - 1, i + 1)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        {/* 月切り替えヘッダー */}
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-dark-400" />
          </button>
          <h2 className="text-lg font-semibold text-dark-100">
            {currentMonth.year}年{currentMonth.month}月
          </h2>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* カレンダーテーブル */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto" ref={scrollRef}>
            <table className="w-full min-w-[600px]">
              {/* ヘッダー（メンバー名） */}
              <thead className="bg-dark-700/50 sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-dark-300 sticky left-0 bg-dark-700/50 z-20 min-w-[80px]">
                    日付
                  </th>
                  {members.map(member => (
                    <th 
                      key={member.id}
                      className="p-3 text-center text-sm font-medium min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="text-dark-300 text-xs truncate max-w-[80px]">
                          {member.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ボディ（日付とタスク） */}
              <tbody>
                {dates.map(date => {
                  const dateStr = formatDate(date);
                  const dayOfWeek = getDayOfWeek(date);
                  const isTodayDate = isToday(date);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <tr 
                      key={dateStr}
                      id={`date-${dateStr}`}
                      className={`border-t border-dark-700/50 ${
                        isTodayDate ? 'bg-accent-primary/10' : ''
                      }`}
                    >
                      {/* 日付セル */}
                      <td className={`p-3 sticky left-0 z-10 ${
                        isTodayDate ? 'bg-accent-primary/10' : 'bg-dark-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-medium ${
                            isTodayDate ? 'text-accent-primary' : 
                            isWeekend ? 'text-accent-danger' : 'text-dark-200'
                          }`}>
                            {date.getDate()}
                          </span>
                          <span className={`text-xs ${
                            isWeekend ? 'text-accent-danger' : 'text-dark-500'
                          }`}>
                            {dayOfWeek}
                          </span>
                        </div>
                      </td>

                      {/* メンバーごとのタスクセル */}
                      {members.map(member => {
                        const memberTasks = tasks.filter(
                          t => t.member_id === member.id && isTaskOnDate(t, dateStr)
                        );

                        // 進行中タスクを先に、完了済みを後に
                        const sortedTasks = [...memberTasks].sort((a, b) => {
                          if (a.status === 'pending' && b.status !== 'pending') return -1;
                          if (a.status !== 'pending' && b.status === 'pending') return 1;
                          return 0;
                        });

                        return (
                          <td key={member.id} className="p-2 align-top">
                            <div className="space-y-1">
                              {sortedTasks.map(task => (
                                <div
                                  key={task.id}
                                  onClick={() => handleTaskClick(task)}
                                  className={`task-card group cursor-pointer ${
                                    task.status === 'completed' ? 'completed opacity-50' : ''
                                  }`}
                                  style={{ 
                                    backgroundColor: member.color,
                                    color: getContrastColor(member.color)
                                  }}
                                >
                                  <div className="flex items-start gap-1">
                                    {task.status === 'completed' ? (
                                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    ) : updatingTask === task.id ? (
                                      <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />
                                    ) : (
                                      <button
                                        onClick={(e) => handleCompleteTask(task, e)}
                                        className="w-4 h-4 flex-shrink-0 mt-0.5 rounded border border-current opacity-60 hover:opacity-100 transition-opacity"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        {task.title}
                                      </p>
                                      <p className="text-[10px] opacity-80">
                                        ¥{(task.amount / 10000).toFixed(0)}万
                                      </p>
                                    </div>
                                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap gap-2 px-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              <span className="text-xs text-dark-400">{member.name}</span>
            </div>
          ))}
        </div>
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
