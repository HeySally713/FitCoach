// src/utils/dateGroup.ts
// 운동 세션을 날짜 기준으로 그룹화

import { WorkoutSession } from '../types/workout';

export interface SessionGroup {
  label: string;          // "이번 주", "지난 주", "5월"
  sublabel?: string;      // "5/4 - 5/10"
  sessions: WorkoutSession[];
}

/** YYYY-MM-DD 문자열 → Date */
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/** 이번 주 월요일 00:00 (로컬) */
function getThisMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ...
  const diff = day === 0 ? -6 : 1 - day; // 일요일이면 -6, 월요일이면 0
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** 날짜 → "5/4 (월)" 형식 */
export function formatShortDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

/** 오늘/어제/N일 전/날짜 */
export function formatRelativeDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `오늘 · ${formatShortDate(dateStr)}`;
  if (diffDays === 1) return `어제 · ${formatShortDate(dateStr)}`;
  if (diffDays < 7) return `${diffDays}일 전 · ${formatShortDate(dateStr)}`;
  return formatShortDate(dateStr);
}

/** 주 범위 라벨: "5/4 - 5/10" */
function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;
}

/**
 * 세션 배열을 날짜 그룹으로 분류
 * - 이번 주 (월~일)
 * - 지난 주
 * - 이번 달 (이번 주/지난 주 제외)
 * - 그 이전 (월별)
 */
export function groupSessionsByPeriod(sessions: WorkoutSession[]): SessionGroup[] {
  const thisMonday = getThisMonday();
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const thisMonthStart = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), 1);

  const thisWeek: WorkoutSession[] = [];
  const lastWeek: WorkoutSession[] = [];
  const thisMonth: WorkoutSession[] = [];
  const olderByMonth: Map<string, WorkoutSession[]> = new Map();

  for (const session of sessions) {
    const d = parseDate(session.date);

    if (d >= thisMonday) {
      thisWeek.push(session);
    } else if (d >= lastMonday) {
      lastWeek.push(session);
    } else if (d >= thisMonthStart) {
      thisMonth.push(session);
    } else {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!olderByMonth.has(key)) olderByMonth.set(key, []);
      olderByMonth.get(key)!.push(session);
    }
  }

  const groups: SessionGroup[] = [];

  if (thisWeek.length > 0) {
    groups.push({
      label: '이번 주',
      sublabel: formatWeekRange(thisMonday),
      sessions: thisWeek,
    });
  }
  if (lastWeek.length > 0) {
    groups.push({
      label: '지난 주',
      sublabel: formatWeekRange(lastMonday),
      sessions: lastWeek,
    });
  }
  if (thisMonth.length > 0) {
    groups.push({
      label: `${thisMonthStart.getMonth() + 1}월`,
      sublabel: '이번 달',
      sessions: thisMonth,
    });
  }

  // 월별 그룹 (최신순)
  const sortedMonthKeys = Array.from(olderByMonth.keys()).sort().reverse();
  for (const key of sortedMonthKeys) {
    const [year, month] = key.split('-');
    groups.push({
      label: `${parseInt(month, 10)}월`,
      sublabel: `${year}년`,
      sessions: olderByMonth.get(key)!,
    });
  }

  return groups;
}
