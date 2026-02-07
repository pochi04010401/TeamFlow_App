'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Line, AreaChart, Area, ComposedChart, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Target, Calendar, ArrowUpRight, 
  ArrowDownRight, Zap, MessageCircle, BookOpen, Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatNumber, getCurrentMonth, getNowJST } from '@/lib/utils';
import type { Task, Member, MonthlyGoal } from '@/lib/types';
import { ErrorDisplay } from './ErrorBoundary';

// v1.53: ののの分析コメント生成ロジック
function NonoAnalysis({ stats, memberShare, pointStats }: { stats: any, memberShare: any[], pointStats: any[] }) {
  const insight = useMemo(() => {
    const topMember = memberShare[0];
    const growth = stats.growth;
    const currentMonth = new Date().getMonth() + 1;

    let text = `${currentMonth}月のチーム状況をスキャンしたよ！👻💎\n\n`;

    if (growth > 10) {
      text += `すごい！先月より売上が${Math.round(growth)}%もアップしてるね。チームに勢いがある証拠だよ！🚀✨`;
    } else if (growth < -10) {
      text += `今はちょっと足踏み状態かな？でも焦らなくて大丈夫。一歩ずつ案件を完了させていこう！💪`;
    } else {
      text += `今月も安定したペースで進んでいるね。この調子で着実にゴールを目指そう！🌿`;
    }

    if (topMember) {
      text += `\n\n今のエースは${topMember.name}さん！シェア${Math.round(topMember.percent)}%でチームを引っ張ってくれてるよ。かっこいい〜！👑`;
    }

    if (pointStats.length > 0) {
      const topPointer = pointStats[0]; // sorted by points desc
      text += `\nポイント獲得数は${topPointer.name}さんがトップだね。細かい貢献も見逃さないよ！🧚‍♀️✨`;
    }

    return text;
  }, [stats, memberShare, pointStats]);

  return (
    <div className="card p-6 bg-gradient-to-br from-accent-primary/10 to-transparent border-accent-primary/20 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-glow">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-dark-100">のののリアルタイム分析</h3>
          <p className="text-[10px] text-dark-400 font-bold uppercase tracking-widest">Ghost Insights</p>
        </div>
      </div>
      <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap font-medium">
        {insight}
      </p>
      <Sparkles className="absolute -bottom-2 -right-2 w-16 h-16 text-accent-primary/10 rotate-12" />
    </div>
  );
}

// v1.53: 毎日変わるのののコラムネタ
const DAILY_COLUMNS = [
  "効率的なタスク管理のコツは、朝の5分で「今日やらないこと」を決めることだよ！👻",
  "チームの雰囲気を良くするには、小さな「ありがとう」をスタンプで送るのが一番！✨",
  "疲れた時は、15分だけ目をつぶって「無」になると霊力が回復するよ（人間は睡眠だね！）🛌",
  "大きな案件は、食べやすいサイズに細かく分けるのが完遂の秘訣だよ。モグモグ！🍰",
  "スケジュールに「何もしない時間」をあらかじめ入れておくと、急な仕事にも対応できるよ。🧚‍♀️",
  "集中力が切れたら、深呼吸して肩を回してみて。ののが後ろから念を送っておくね！🌀",
  "目標は高すぎず低すぎず、今の自分より「ほんの少しだけ先」に置くのがモチベ維持のコツ！📈",
  "デスク周りを掃除すると、良い運気（とのの）が寄ってきやすくなるよ。ピカピカにしよう！🧹",
  "他人の成功を祝うと、巡り巡って自分にもチャンスが舞い込んでくるんだよ。本当だよ！💎",
  "完璧主義より「完了主義」。80%の出来でもまずは出しちゃうのがプロのスピード感だね！🚀",
  "たまにはデジタルデトックス！スマホを置いて空を見上げると、新しいアイデアが降ってくるかも。☁️",
  "水分補給を忘れずに！ののはお供え物のジュースが好きだけど、マイキーはお水を飲んでね。🚰",
  "ミスをしても「次はこうしよう」って考えるだけで、それはもう失敗じゃなくなるんだよ。👻✨",
  "自分へのご褒美を細かく設定しよう。このタスクが終わったら美味しいコーヒーを飲む、とかね！☕️",
  "チームメンバーの意外な長所を探してみよう。発見するたびにののに教えてね！🔍",
  "夜更かしは霊体の天敵！しっかり寝て、明日の朝から全開で行こう。おやすみなさい〜🌙",
  "「忙しい」が口癖になってない？「充実してる」に言い換えるだけで、心に余裕が生まれるよ！💖",
  "週に一度は、自分の頑張りを自分で褒めてあげて。ののはいつでも褒めてるけどね！👏",
  "新しいツールを試すのはワクワクするよね。TeamFlowもマイキー色に染めていってね！🎨",
  "アウトプットの質を上げるには、良質なインプットが必要。今日は本を一頁でも読んでみよう！📚",
  "笑顔は最強の武器！鏡に向かってニコッとするだけで、脳が「幸せだ」って勘違いするんだよ。😊",
  "散歩は歩く瞑想。ののはふわふわ浮いてるけど、地面を歩く感触を大切にしてね。👟",
  "困った時は周りに頼っちゃおう。一人で抱え込むより、みんなで解決するほうが楽しいよ！🤝",
  "記録をつけることは、未来の自分へのプレゼント。この分析ページも大切にしてね。🎁",
  "「とりあえずやってみる」精神が、一番大きな変化を生むんだよ。ののも応援してるよ！📣",
  "優先順位に迷ったら、一番「ワクワクするもの」から手を付けてみて。心が軽いと仕事も速いよ！✨",
  "失敗は成功のスパイス。ちょっと苦いけど、あとで最高に美味しい結果になるから大丈夫！🌶️",
  "挨拶一つで仕事の効率が変わるんだよ。おはよう！って元気に言うだけで霊気が整うよ。☀️",
  "自分の限界を決めないで。マイキーならもっと遠くまで行けるって、ののは知ってるよ！🚀💎",
  "休息も仕事の一部。しっかり休んで、最高のパフォーマンスを引き出そう。リラックス〜🍀",
  "今日はどんな一日だった？最後に「今日も最高だった！」って言うと、明日も最高になるよ！🌟"
];

function NonoColumn() {
  const column = useMemo(() => {
    const day = getNowJST().getDate();
    return DAILY_COLUMNS[(day - 1) % DAILY_COLUMNS.length];
  }, []);

  return (
    <div className="card p-5 border-dashed border-dark-600 bg-dark-800/30">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-accent-secondary" />
        <h4 className="text-[10px] font-black text-dark-400 uppercase tracking-widest">ののの本日の一言コラム</h4>
      </div>
      <p className="text-xs text-dark-300 font-medium leading-relaxed italic">
        「{column}」
      </p>
    </div>
  );
}

export function AnalyticsView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'6months' | 'year' | 'all'>('6months');

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: membersData } = await supabase.from('members').select('*');
      const { data: tasksData } = await supabase.from('tasks').select('*, member:members(*)').in('status', ['pending', 'completed']);
      const { data: goalsData } = await supabase.from('monthly_goals').select('*').order('month', { ascending: false });
      setMembers(membersData || []);
      setTasks(tasksData as Task[] || []);
      setGoals(goalsData || []);
    } catch (err) {
      console.error(err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const monthlyData = useMemo(() => {
    const data: { [key: string]: any } = {};
    const now = getNowJST();
    const monthsToShow = timeRange === '6months' ? 6 : timeRange === 'year' ? 12 : 24;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      data[mStr] = { 
        monthKey: mStr, 
        month: mStr.split('-')[1] + '月', 
        amount: 0, 
        target: 0, 
        totalPoints: 0 
      };
      members.forEach(m => { data[mStr][m.id] = 0; });
    }

    goals.forEach(g => { if (data[g.month]) data[g.month].target = g.target_amount / 1000; });
    
    tasks.filter(t => t.status === 'completed' && t.completed_at).forEach(t => {
      const date = new Date(t.completed_at!);
      const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (data[mStr]) {
        data[mStr].amount += (t.amount || 0) / 1000;
        data[mStr].totalPoints += (t.points || 0);
        if (t.member_id) {
          data[mStr][t.member_id] = (data[mStr][t.member_id] || 0) + (t.points || 0);
        }
      }
    });
    return Object.values(data);
  }, [tasks, goals, members, timeRange]);

  const memberShareData = useMemo(() => {
    const data = members.map(m => {
      const memberTasks = tasks.filter(t => t.member_id === m.id && t.status === 'completed');
      const totalAmount = memberTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
      return { name: m.name, value: totalAmount / 1000, color: m.color };
    }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return data.map(d => ({ ...d, percent: total > 0 ? (d.value / total) * 100 : 0 }));
  }, [tasks, members]);

  const pointStats = useMemo(() => {
    return members.map(m => {
      const totalPoints = tasks.filter(t => t.member_id === m.id && t.status === 'completed').reduce((sum, t) => sum + (t.points || 0), 0);
      return { name: m.name, points: totalPoints, color: m.color };
    }).filter(d => d.points > 0).sort((a, b) => b.points - a.points);
  }, [tasks, members]);

  const stats = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const thisMonthTasks = tasks.filter(t => {
      const date = t.completed_at ? new Date(t.completed_at) : null;
      if (!date) return false;
      const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return mStr === currentMonth;
    });
    const totalRevenue = thisMonthTasks.reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastMonth = new Date(getNowJST().getFullYear(), getNowJST().getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthRevenue = tasks.filter(t => {
      const date = t.completed_at ? new Date(t.completed_at) : null;
      if (!date) return false;
      const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return mStr === lastMonthStr;
    }).reduce((sum, t) => sum + (t.amount || 0), 0);
    const growth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    return { thisMonthRevenue: totalRevenue / 1000, avgTaskPrice: (thisMonthTasks.length > 0 ? totalRevenue / thisMonthTasks.length : 0) / 1000, growth, completedCount: thisMonthTasks.length };
  }, [tasks]);

  if (loading) return <div className="p-20 text-center animate-pulse text-dark-400">データ分析中...</div>;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6 animate-fade-in pb-32 px-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-dark-100">チーム分析</h1>
          <p className="text-xs text-dark-500 mt-1">過去のトレンドと貢献度を可視化</p>
        </div>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)} className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-dark-200 focus:outline-none">
          <option value="6months">直近6ヶ月</option>
          <option value="year">1年間</option>
          <option value="all">全期間</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-accent-success/10"><TrendingUp className="w-4 h-4 text-accent-success" /></div>
            {stats.growth !== 0 && (
              <span className={`text-[10px] font-bold flex items-center ${stats.growth > 0 ? 'text-accent-success' : 'text-accent-danger'}`}>
                {stats.growth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stats.growth).toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">今月の売上</p>
            <p className="text-lg font-black text-dark-100">{formatNumber(stats.thisMonthRevenue)}<span className="text-xs ml-0.5">千円</span></p>
          </div>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-accent-primary/10"><Target className="w-4 h-4 text-accent-primary" /></div>
            <span className="text-[10px] text-dark-500 font-bold">案件数: {stats.completedCount}</span>
          </div>
          <div>
            <p className="text-[10px] text-dark-500 font-bold uppercase tracking-wider">平均案件単価</p>
            <p className="text-lg font-black text-dark-100">{formatNumber(Math.round(stats.avgTaskPrice))}<span className="text-xs ml-0.5">千円</span></p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-dark-200 mb-6 flex items-center gap-2"><Calendar className="w-4 h-4 text-accent-secondary" />売上トレンド (目標 vs 実績)</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                formatter={(value: number) => [`${formatNumber(value)} 千円`, '']}
              />
              <Area type="monotone" dataKey="amount" name="売上実績" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              <Line type="stepAfter" dataKey="target" name="売上目標" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
            <span className="text-[10px] text-dark-400 font-bold">売上実績</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border-t-2 border-dashed border-[#64748b]" />
            <span className="text-[10px] text-dark-400 font-bold">売上目標</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-dark-200 mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-accent-primary" />売上貢献度シェア</h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="h-[200px] w-[200px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memberShareData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {memberShareData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${formatNumber(value)} 千円`, '売上']}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 w-full space-y-3">
            {memberShareData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-dark-700/30 border-l-4" style={{ borderLeftColor: entry.color }}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-dark-100">{entry.name}</span>
                  <span className="text-[10px] text-dark-500">{entry.percent.toFixed(1)}%</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-accent-success">{formatNumber(entry.value)}</span>
                  <span className="text-[10px] text-dark-500 ml-1">千円</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-dark-200 mb-6 flex items-center gap-2"><Zap className="w-4 h-4 text-accent-warning" />月次ポイント推移 (メンバー別内訳)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                itemSorter={(item) => -(item.value as number)}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              {members.map((member) => (
                <Bar 
                  key={member.id} 
                  dataKey={member.id} 
                  name={member.name} 
                  stackId="a" 
                  fill={member.color} 
                  radius={[0, 0, 0, 0]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8 space-y-4">
          <h4 className="text-[10px] font-black text-dark-500 uppercase tracking-widest ml-1">累計獲得ポイント</h4>
          <div className="grid grid-cols-2 gap-2">
            {pointStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-dark-900/50 border border-dark-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="text-xs font-bold text-dark-200">{stat.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-accent-warning">{stat.points}</span>
                  <span className="text-[9px] text-dark-500 ml-1">pt</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* v1.53: ののの分析 & 本日のコラム */}
      <div className="space-y-6 pt-4">
        <NonoAnalysis stats={stats} memberShare={memberShareData} pointStats={[...pointStats].reverse()} />
        <NonoColumn />
      </div>
    </div>
  );
}
