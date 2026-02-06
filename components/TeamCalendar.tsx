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
import { getHolidayName } from '@/lib/holidays';
import type { Member, CalendarTask } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';
import { toast } from 'sonner';
import { TaskEditModal } from './TaskEditModal';

const ROW_HEIGHT = 64; // 1日の高さ

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
        .neq('status', 'completed');

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

  const dates = useMemo(() => {
    return Array.from(
      { length: new Date(currentMonth.year, currentMonth.month, 0).getDate() },
      (_, i) => new Date(currentMonth.year, currentMonth.month - 1, i + 1)
    );
  }, [currentMonth]);

  const visibleMembers = useMemo(() => {
    if (!selectedMemberId) return members;
    return members.filter(m => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  if (loading) return <div className="p-20 text-center animate-pulse text-dark-400">カレンダー作成中...</div>;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-4 animate-fade-in pb-40">
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

      <div className="card overflow-hidden shadow-2xl border-dark-700 max-h-[80vh] flex flex-col">
        <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-dark-600" ref={scrollRef}>
          {/* グリッドコンテナ */}
          <div className="relative min-w-[max-content] flex">
            
            {/* 左側: 日付列 (固定) */}
            <div className="sticky left-0 z-30 bg-dark-900 border-r border-dark-700/50 w-16 flex-shrink-0">
              {/* ヘッダーの角 */}
              <div className="sticky top-0 z-40 bg-dark-900 h-14 border-b border-dark-700/50 flex items-center justify-center text-[10px] text-dark-500 font-black">
                日付
              </div>
              {/* 日付リスト */}
              {dates.map((date) => {
                const isTodayDate = isToday(date);
                const holiday = getHolidayName(date);
                const dayOfWeek = date.getDay();
                const isSun = dayOfWeek === 0;
                const isSat = dayOfWeek === 6;

                const dateColor = isTodayDate ? 'text-accent-primary' :
                                 holiday || isSun ? 'text-accent-danger' :
                                 isSat ? 'text-accent-secondary' : 'text-dark-300';

                return (
                  <div 
                    key={date.toISOString()} 
                    style={{ height: ROW_HEIGHT }}
                    className={`flex flex-col items-center justify-center border-b border-dark-700/20 bg-dark-800/95 ${isTodayDate ? 'bg-accent-primary/5' : ''}`}
                  >
                    <span className={`text-lg font-black leading-none ${dateColor}`}>{date.getDate()}</span>
                    <span className={`text-[10px] font-bold ${holiday ? 'text-accent-danger' : 'text-dark-500'}`}>
                      {holiday || getDayOfWeek(date)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 右側: メンバー列 */}
            <div className="flex flex-1">
              {visibleMembers.map((member) => {
                const memberTasks = tasks.filter(t => t.member_id === member.id);

                return (
                  <div key={member.id} className="relative min-w-[180px] border-r border-dark-700/20">
                    {/* メンバーヘッダー (固定) */}
                    <div className="sticky top-0 z-20 bg-dark-900/95 backdrop-blur-md h-14 border-b border-dark-700/50 flex flex-col items-center justify-center gap-1">
                      <div className="w-2 h-2 rounded-full shadow-glow-sm" style={{ backgroundColor: member.color }} />
                      <span className="text-[11px] font-bold text-dark-200">{member.name}</span>
                    </div>

                    {/* カラム本体 (背景グリッド) */}
                    <div className="relative">
                      {dates.map((date) => {
                        const isTodayDate = isToday(date);
                        const holiday = getHolidayName(date);
                        const dayOfWeek = date.getDay();
                        const rowBg = isTodayDate ? 'bg-accent-primary/10' : 
                                     holiday ? 'bg-accent-danger/10' :
                                     dayOfWeek === 0 ? 'bg-accent-danger/5' :
                                     dayOfWeek === 6 ? 'bg-accent-secondary/5' : '';
                        
                        return (
                          <div 
                            key={date.toISOString()} 
                            style={{ height: ROW_HEIGHT }}
                            className={`border-b border-dark-700/10 ${rowBg}`}
                          />
                        );
                      })}

                      {/* タスクブロック (絶対配置 v1.13) */}
                      {memberTasks.map(task => {
                        const startIndex = dates.findIndex(d => formatDate(d) === task.start_date);
                        const endIndex = dates.findIndex(d => formatDate(d) === task.end_date);
                        
                        // 月を跨ぐ場合のクランプ処理
                        if (startIndex === -1 && endIndex === -1) return null;
                        const actualStart = startIndex === -1 ? 0 : startIndex;
                        const actualEnd = endIndex === -1 ? dates.length - 1 : endIndex;
                        const span = actualEnd - actualStart + 1;

                        return (
                          <div 
                            key={task.id}
                            onClick={() => setEditingTask(task)}
                            className="absolute left-1 right-1 z-10 p-1 group cursor-pointer transition-transform hover:scale-[1.01]"
                            style={{
                              top: actualStart * ROW_HEIGHT + 4,
                              height: span * ROW_HEIGHT - 8,
                            }}
                          >
                            <div 
                              className="h-full w-full rounded-xl shadow-glow-sm flex flex-col p-2 overflow-hidden border border-white/10"
                              style={{ 
                                backgroundColor: member.color,
                                color: getContrastColor(member.color)
                              }}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="text-[11px] font-black leading-tight line-clamp-3">
                                  {task.title}
                                </span>
                                {endIndex !== -1 && (
                                  <button 
                                    onClick={(e) => handleToggleComplete(e, task)}
                                    className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors flex-shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              {task.notes && (
                                <p className="text-[9px] mt-1 opacity-80 line-clamp-2">
                                  {task.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
