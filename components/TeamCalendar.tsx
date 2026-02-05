'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Users, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { 
  formatDate, 
  getDayOfWeek, 
  isToday, 
  getContrastColor,
  fireConfetti,
  isBetween
} from '@/lib/utils';
import type { Member, CalendarTask } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { toast } from 'sonner';
import { TaskEditModal } from './TaskEditModal';

// メンバー選択ドロップダウン (v1.7)
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

export function TeamCalendar() {
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
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

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, member:members(*)')
        .lte('start_date', endOfMonth)
        .gte('end_date', startOfMonth)
        .neq('status', 'completed'); // v1.2: Always hide completed in calendar

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
    e.stopPropagation();
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== task.id));
      await fireConfetti();
      toast.success('タスクを完了しました！');
    } catch (err) {
      toast.error('更新に失敗しました');
    }
  };

  const filteredTasks = useMemo(() => {
    if (!selectedMemberId) return tasks;
    return tasks.filter(t => t.member_id === selectedMemberId);
  }, [tasks, selectedMemberId]);

  // v1.8: フィルタされたメンバーだけを表示
  const visibleMembers = useMemo(() => {
    if (!selectedMemberId) return members;
    return members.filter(m => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  const dates = Array.from(
    { length: new Date(currentMonth.year, currentMonth.month, 0).getDate() },
    (_, i) => new Date(currentMonth.year, currentMonth.month - 1, i + 1)
  );

  if (loading) return <div className="p-20 text-center animate-pulse text-dark-400">カレンダー作成中...</div>;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4 animate-fade-in pb-32">
      <div className="flex items-center justify-between px-2 gap-4 flex-wrap">
        <MemberFilter 
          members={members}
          selectedMemberId={selectedMemberId}
          onSelect={setSelectedMemberId}
        />
        
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(prev => prev.month === 1 ? {year: prev.year-1, month: 12} : {...prev, month: prev.month-1})} className="p-1 text-dark-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-dark-100">{currentMonth.year}年{currentMonth.month}月</span>
          <button onClick={() => setCurrentMonth(prev => prev.month === 12 ? {year: prev.year+1, month: 1} : {...prev, month: prev.month+1})} className="p-1 text-dark-400 hover:text-white">
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
                {visibleMembers.map(m => (
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
              {dates.map((date, index) => {
                const dateStr = formatDate(date);
                const isTodayDate = isToday(date);
                const isLast = index === dates.length - 1;
                
                return (
                  <tr key={dateStr} className={`border-t border-dark-700/20 ${isTodayDate ? 'bg-accent-primary/5' : ''} ${isLast ? 'pb-20' : ''}`}>
                    <td className={`p-3 text-center border-r border-dark-700/30 sticky left-0 z-10 bg-dark-800/95 backdrop-blur-sm ${isLast ? 'rounded-bl-xl' : ''}`}>
                      <span className={`block text-lg font-black leading-none ${isTodayDate ? 'text-accent-primary' : 'text-dark-300'}`}>{date.getDate()}</span>
                      <span className="text-[10px] text-dark-500 font-bold">{getDayOfWeek(date)}</span>
                    </td>
                    {visibleMembers.map(member => {
                      const memberTasks = filteredTasks.filter(t => 
                        t.member_id === member.id && 
                        isBetween(dateStr, t.start_date, t.end_date)
                      );

                      return (
                        <td key={member.id} className="p-1 align-top min-h-[50px] relative">
                          <div className="space-y-1">
                            {memberTasks.map(task => {
                              const isStart = task.start_date === dateStr;
                              const isEnd = task.end_date === dateStr;
                              
                              return (
                                <div 
                                  key={task.id}
                                  onClick={() => setEditingTask(task)}
                                  className={`task-bar relative shadow-glow-sm transition-transform hover:scale-[1.02] cursor-pointer`}
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
                                      <div className="flex-1 h-1" />
                                    )}
                                    {isEnd && (
                                      <button 
                                        onClick={(e) => handleToggleComplete(e, task)}
                                        className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors flex-shrink-0 ml-1"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {/* v1.8: 余白調整 */}
                            {isLast && <div className="h-10" />}
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
