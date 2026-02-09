'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { calculatePercentage, getNowJST } from '@/lib/utils';
import type { DashboardSummary, MemberStats } from '@/lib/types';

export function AnalystInsight({ summary, memberStats }: { summary: DashboardSummary, memberStats: MemberStats[] }) {
  const insight = useMemo(() => {
    const revenuePercent = calculatePercentage(summary.completedAmount, summary.targetAmount);
    const pointPercent = calculatePercentage(summary.completedPoints, summary.targetPoints);
    const topMember = [...memberStats].sort((a, b) => b.completedAmount - a.completedAmount)[0];
    const now = getNowJST();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

    let text = `現在、${now.getMonth() + 1}月の営業日数の約${monthProgress}%が経過しました。現状のデータを分析します。📊\n\n`;

    if (revenuePercent >= monthProgress) {
      text += `売上達成率は${revenuePercent}%と、カレンダーの進捗を上回る非常に良いペースです。目標達成の可能性が高いでしょう。🚀✨`;
    } else {
      text += `売上達成率は${revenuePercent}%で、目標に対してやや遅れが見られます。後半の巻き返しに期待しましょう。💪`;
    }

    if (topMember && topMember.completedAmount > 0) {
      text += `\n\n現在の貢献度トップは${topMember.member.name}さんです。チーム全体の売上の多くを牽引しています。`;
    }

    if (pointPercent > 80) {
      text += `\nまた、ポイント達成率が${pointPercent}%を超えており、チームの質的な活動も非常に活発であると評価できます。🧚‍♀️`;
    }

    return text;
  }, [summary, memberStats]);

  return (
    <div className="card p-5 border-dashed border-dark-600 bg-dark-800/30">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-accent-primary" />
        <h4 className="text-[10px] font-black text-dark-400 uppercase tracking-widest">見習いアナリストの現状分析</h4>
      </div>
      <p className="text-xs text-dark-300 font-medium leading-relaxed italic whitespace-pre-wrap">
        「{insight}」
      </p>
    </div>
  );
}
