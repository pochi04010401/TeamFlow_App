// 日本の祝日判定 (2025-2026 簡易版)
export function getHolidayName(date: Date): string | null {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = date.getDay(); // 0:日, 1:月...

  // 2026年 祝日データ
  if (y === 2026) {
    if (m === 1 && d === 1) return '元日';
    if (m === 1 && d === 12) return '成人の日';
    if (m === 2 && d === 11) return '建国記念の日';
    if (m === 2 && d === 23) return '天皇誕生日';
    if (m === 3 && d === 20) return '春分の日';
    if (m === 4 && d === 29) return '昭和の日';
    if (m === 5 && d === 3) return '憲法記念日';
    if (m === 5 && d === 4) return 'みどりの日';
    if (m === 5 && d === 5) return 'こどもの日';
    if (m === 5 && d === 6) return '振替休日';
    if (m === 7 && d === 20) return '海の日';
    if (m === 8 && d === 11) return '山の日';
    if (m === 9 && d === 21) return '敬老の日';
    if (m === 9 && d === 22) return '国民の休日';
    if (m === 9 && d === 23) return '秋分の日';
    if (m === 10 && d === 12) return 'スポーツの日';
    if (m === 11 && d === 3) return '文化の日';
    if (m === 11 && d === 23) return '勤労感謝の日';
  }
  
  // 2025年 (念のため)
  if (y === 2025) {
    if (m === 1 && d === 1) return '元日';
    if (m === 2 && d === 11) return '建国記念の日';
    if (m === 2 && d === 23) return '天皇誕生日';
    if (m === 2 && d === 24) return '振替休日';
    if (m === 3 && d === 20) return '春分の日';
    if (m === 4 && d === 29) return '昭和の日';
    if (m === 5 && d === 3) return '憲法記念日';
    if (m === 5 && d === 4) return 'みどりの日';
    if (m === 5 && d === 5) return 'こどもの日';
    if (m === 5 && d === 6) return '振替休日';
    if (m === 7 && d === 21) return '海の日';
    if (m === 8 && d === 11) return '山の日';
    if (m === 9 && d === 15) return '敬老の日';
    if (m === 9 && d === 23) return '秋分の日';
    if (m === 10 && d === 13) return 'スポーツの日';
    if (m === 11 && d === 3) return '文化の日';
    if (m === 11 && d === 23) return '勤労感謝の日';
    if (m === 11 && d === 24) return '振替休日';
  }

  return null;
}
