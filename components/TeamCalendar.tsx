'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Filter, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  formatDate, 
  getDayOfWeek, 
  isToday, 
  getContrastColor,
  fireConfetti,
  isBetween
} from '@/lib/utils';
import type { Member, Task, CalendarTask } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { toast } from 'sonner';
import { TaskEditModal } from './TaskEditModal';

export function TeamCalendar() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      const { data: membersData } = await supabase.from('members').select('*').order('name');
      
      const startOfMonth = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`;
      const endOfMonth = new Date(currentMonth.year, currentMonth.month, 0).toISOString().split('T')[0];

      // OR logic for period overlap: (start <= monthEnd) AND (end >= monthStart)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .lte('start_date', endOfMonth)
        .gte('end_date', startOfMonth);

      setMembers(membersData || []);
      setTasks(tasksData as CalendarTask[] || []);
    } catch (err) {
      console.error(err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentMonth]);

  const handleToggleComplete = async (e: React.MouseEvent, task: CalendarTask) => {
    e.stopPropagation(); // Don't open edit modal
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
        .eq('id', task.id);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      
      if (newStatus === 'completed') {
        await fireConfetti();
        toast.success('タスクを完了しました！');
      } else {
        toast('タスクを進行中に戻しました');
      }
    } catch (err) {
      toast.error('更新に失敗しました');
    }
  };

  const visibleTasks = useMemo(() => {
    return hideCompleted ? tasks.filter(t => t.status !== 'completed') : tasks;
  }, [tasks, hideCompleted]);

  // 月の日付
  const dates = Array.from(
    { length: new Date(currentMonth.year, currentMonth.month, 0).getDate() },
    (_, i) => new Date(currentMonth.year, currentMonth.month - 1, i + 1)
  );

  if (loading) return <div className="p-20 text-center animate-pulse">カレンダー作成中...</div>;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      <div className="flex items-center justify-end px-2">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(prev => prev.month === 1 ? {year: prev.year-1, month: 12} : {...prev, month: prev.month-1})} className="p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold">{currentMonth.year}年{currentMonth.month}月</span>
          <button onClick={() => setCurrentMonth(prev => prev.month === 12 ? {year: prev.year+1, month: 1} : {...prev, month: prev.month+1})} className="p-1">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden shadow-2xl border-dark-700 max-h-[70vh] flex flex-col">
        <div className="overflow-auto flex-1" ref={scrollRef}>
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-dark-900/95 sticky top-0 z-40 backdrop-blur-md">
                <th className="p-3 text-left text-[10px] uppercase text-dark-500 font-black tracking-widest border-r border-dark-700/30 sticky left-0 bg-dark-900 z-50 w-16">日付</th>
                {members.map(m => (
                  <th key={m.id} className="p-3 text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full shadow-glow-sm" style={{ backgroundColor: m.color }} />
                      <span className="text-[11px] font-bold text-dark-200">{m.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map(date => {
                const dateStr = formatDate(date);
                const isTodayDate = isToday(date);
                
                return (
                  <tr key={dateStr} className={`border-t border-dark-700/20 ${isTodayDate ? 'bg-accent-primary/5' : ''}`}>
                    <td className={`p-3 text-center border-r border-dark-700/30 sticky left-0 z-10 bg-dark-800/90 backdrop-blur-sm`}>
                      <span className={`block text-lg font-black leading-none ${isTodayDate ? 'text-accent-primary' : 'text-dark-300'}`}>{date.getDate()}</span>
                      <span className="text-[10px] text-dark-500 font-bold">{getDayOfWeek(date)}</span>
                    </td>
                    {members.map(member => {
                      // v1.2: Check if date is within task period
                      const memberTasks = visibleTasks.filter(t => 
                        t.member_id === member.id && 
                        isBetween(dateStr, t.start_date, t.end_date)
                      );

                      return (
                        <td key={member.id} className="p-1 align-top min-h-[60px]">
                          <div className="space-y-1">
                            {memberTasks.map(task => {
                              const isStart = task.start_date === dateStr;
                              const isEnd = task.end_date === dateStr;
                              
                              return (
                                <div 
                                  key={task.id}
                                  onClick={() => setEditingTask(task)}
                                  className={`task-bar relative ${task.status === 'completed' ? 'opacity-30' : 'shadow-glow-sm'}`}
                                  style={{ 
                                    backgroundColor: member.color,
                                    color: getContrastColor(member.color),
                                    borderRadius: `${isStart ? '8px' : '0'} ${isEnd ? '8px' : '0'} ${isEnd ? '8px' : '0'} ${isStart ? '8px' : '0'}`,
                                    marginTop: '1px',
                                    marginBottom: '1px',
                                    borderLeft: isStart ? 'none' : `1px solid rgba(0,0,0,0.1)`,
                                    borderRight: isEnd ? 'none' : `1px solid rgba(0,0,0,0.1)`,
                                  }}
                                >
                                  <div className="flex items-center justify-between px-2 py-1 min-h-[32px]">
                                    {isStart ? (
                                      <span className="text-[10px] font-bold truncate leading-tight flex-1">
                                        {task.title}
                                      </span>
                                    ) : (
                                      <div className="flex-1 h-1" /> /* 継続中の隙間埋め */
                                    )}
                                    {isEnd && (
                                      <button 
                                        onClick={(e) => handleToggleComplete(e, task)}
                                        className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors flex-shrink-0 ml-1"
                                      >
                                        {task.status === 'completed' ? <Check className="w-2.5 h-2.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/60" />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
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
      
      {editingTask && (
        <TaskEditModal 
          task={editingTask} 
          members={members}
          onClose={() => setEditingTask(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
