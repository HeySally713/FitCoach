// src/components/StatsView.tsx
// 통계 뷰 - 주간 요약 + 카테고리별 + 주간 추이 + 누적

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { WorkoutSession } from '../types/workout';
import {
  StatsPeriod,
  getWeeklyStats,
  getCategoryStats,
  getWeeklyTrend,
  getTotalWorkoutDays,
  getTopExercises,
  getPersonalRecords,
} from '../utils/stats';
import { BODY_PART_EMOJI } from '../types/workout';

interface StatsViewProps {
  sessions: WorkoutSession[];
  period: StatsPeriod;
  weeklyGoal?: number;
}

export const StatsView: React.FC<StatsViewProps> = ({
  sessions,
  period,
  weeklyGoal = 3,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const weekly = useMemo(
    () => getWeeklyStats(sessions, weeklyGoal),
    [sessions, weeklyGoal]
  );
  const categories = useMemo(
    () => getCategoryStats(sessions, period),
    [sessions, period]
  );
  const trend = useMemo(() => getWeeklyTrend(sessions, 4), [sessions]);
  const totalDays = useMemo(() => getTotalWorkoutDays(sessions), [sessions]);
  const topExercises = useMemo(() => getTopExercises(sessions, 3), [sessions]);
  const prs = useMemo(() => getPersonalRecords(sessions).slice(0, 5), [sessions]);

  const periodLabel =
    period === 'week' ? '이번 주' : period === 'month' ? '이번 달' : '올해';

  const toggleCategory = (cat: string) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  // 카테고리 총합 (퍼센트 계산용)
  const totalCategoryCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. 주간 요약 카드 (항상 이번 주 기준) */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>📅 이번 주 요약</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{weekly.workoutDays}</Text>
            <Text style={styles.summaryLabel}>운동 일수</Text>
            <Text style={styles.summarySub}>목표 {weekly.goalDays}일</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{weekly.totalDurationMin}</Text>
            <Text style={styles.summaryLabel}>분</Text>
            <Text style={styles.summarySub}>총 운동 시간</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{weekly.totalCalories}</Text>
            <Text style={styles.summaryLabel}>kcal</Text>
            <Text style={styles.summarySub}>유산소</Text>
          </View>
        </View>

        {/* 진행률 바 */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${weekly.achievementRate * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          목표 달성률 {Math.round(weekly.achievementRate * 100)}%
          {weekly.achievementRate >= 1 && '  🎉'}
        </Text>
      </View>

      {/* 2. 카테고리별 운동량 ({periodLabel}) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏷️ 카테고리별 운동량 · {periodLabel}</Text>
        {totalCategoryCount === 0 ? (
          <Text style={styles.emptyText}>아직 운동 기록이 없어요</Text>
        ) : (
          categories.map((cat) => {
            const percent =
              totalCategoryCount > 0 ? cat.count / totalCategoryCount : 0;
            const isExpanded = expandedCategory === cat.category;

            return (
              <View key={cat.category}>
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => cat.count > 0 && toggleCategory(cat.category)}
                  activeOpacity={cat.count > 0 ? 0.6 : 1}
                >
                  {/* 라벨 */}
                  <View style={styles.categoryLabelRow}>
                    <Text style={styles.categoryLabel}>
                      {cat.emoji} {cat.label}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {cat.count}회
                      {cat.count > 0 && (
                        <Text style={styles.categoryArrow}>
                          {' '}
                          {isExpanded ? '▾' : '▸'}
                        </Text>
                      )}
                    </Text>
                  </View>

                  {/* 비율 막대 */}
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(percent * 100, cat.count > 0 ? 4 : 0)}%`,
                          backgroundColor: getCategoryColor(cat.category),
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.categoryMeta}>
                    {cat.durationMin > 0 && `${cat.durationMin}분`}
                    {cat.calories > 0 && `  ·  🔥 ${cat.calories}kcal`}
                    {totalCategoryCount > 0 && `  ·  ${Math.round(percent * 100)}%`}
                  </Text>
                </TouchableOpacity>

                {/* 부위 드릴다운 (Accordion) */}
                {isExpanded && cat.bodyPartBreakdown.length > 0 && (
                  <View style={styles.drilldown}>
                    <Text style={styles.drilldownTitle}>부위별 비율</Text>
                    {(() => {
                      const drillTotal = cat.bodyPartBreakdown.reduce(
                        (sum, b) => sum + b.count,
                        0
                      );
                      return cat.bodyPartBreakdown.map((bp) => {
                        const bpPercent =
                          drillTotal > 0 ? bp.count / drillTotal : 0;
                        const emoji =
                          BODY_PART_EMOJI[
                            bp.bodyPart as keyof typeof BODY_PART_EMOJI
                          ] ?? '⚪️';
                        return (
                          <View key={bp.bodyPart} style={styles.drilldownRow}>
                            <Text style={styles.drilldownLabel}>
                              {emoji} {bp.bodyPart}
                            </Text>
                            <View style={styles.drilldownBarBg}>
                              <View
                                style={[
                                  styles.drilldownBarFill,
                                  { width: `${bpPercent * 100}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.drilldownCount}>
                              {bp.count}회 ({Math.round(bpPercent * 100)}%)
                            </Text>
                          </View>
                        );
                      });
                    })()}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
      {/* 3. 주간 운동량 추이 (최근 4주) */}
<View style={styles.card}>
  <Text style={styles.cardTitle}>📈 최근 4주 운동량</Text>
  {(() => {
    const maxCount = Math.max(...trend.map((t) => t.count), 1);
    return (
      <View style={styles.chartArea}>
        {trend.map((t, idx) => {
          const heightPercent = (t.count / maxCount) * 100;
          const isThisWeek = idx === trend.length - 1;
          return (
            <View key={t.weekStart} style={styles.chartCol}>
              <View style={styles.chartBarWrap}>
                {t.count > 0 && (
                  <Text style={styles.chartBarValue}>{t.count}</Text>
                )}
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${Math.max(heightPercent, t.count > 0 ? 5 : 0)}%`,
                      backgroundColor: isThisWeek ? '#3B82F6' : '#475569',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.chartLabel,
                  isThisWeek && styles.chartLabelActive,
                ]}
              >
                {t.weekLabel}
              </Text>
              <Text style={styles.chartSub}>
                {t.totalDurationMin > 0 && `${t.totalDurationMin}분`}
              </Text>
            </View>
          );
        })}
      </View>
    );
  })()}
  <Text style={styles.chartHint}>※ 막대 높이 = 운동 일수 (이번 주 강조)</Text>
</View>
{/* 4. 누적 통계 */}
<View style={styles.card}>
  <Text style={styles.cardTitle}>🏆 누적 기록</Text>

  {/* 총 운동 일수 */}
  <View style={styles.totalDaysRow}>
    <Text style={styles.totalDaysNumber}>{totalDays}</Text>
    <Text style={styles.totalDaysLabel}>일째 운동 중</Text>
  </View>

  {/* TOP 3 운동 */}
  <Text style={styles.subSectionTitle}>가장 많이 한 운동</Text>
  {topExercises.length === 0 ? (
    <Text style={styles.emptyText}>아직 기록 없음</Text>
  ) : (
    topExercises.map((ex, idx) => (
      <View key={ex.exerciseName} style={styles.topRow}>
        <Text style={styles.topRank}>
          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
        </Text>
        <Text style={styles.topName}>{ex.exerciseName}</Text>
        <Text style={styles.topCount}>{ex.count}회</Text>
      </View>
    ))
  )}

  {/* PR (Personal Record) */}
  <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>
    💪 운동별 최고 무게
  </Text>
  {prs.length === 0 ? (
    <Text style={styles.emptyText}>아직 무게 기록 없음</Text>
  ) : (
    prs.map((pr) => (
      <View key={pr.exerciseName} style={styles.prRow}>
        <Text style={styles.prName}>{pr.exerciseName}</Text>
        <View style={styles.prRight}>
          <Text style={styles.prWeight}>{pr.maxWeight}kg</Text>
          <Text style={styles.prMeta}>
            × {pr.reps}회 · {pr.date.slice(5)}
          </Text>
        </View>
      </View>
    ))
  )}
</View>

    </ScrollView>
  );
};

// 카테고리별 색상
const getCategoryColor = (cat: string): string => {
  switch (cat) {
    case 'gym':
      return '#3B82F6';
    case 'home':
      return '#10B981';
    case 'cardio':
      return '#F59E0B';
    case 'yoga':
      return '#A78BFA';
    default:
      return '#64748B';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, paddingBottom: 40 },

  // 공통 카드
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },

  // 주간 요약 카드
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { color: '#3B82F6', fontSize: 28, fontWeight: '800' },
  summaryLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  summarySub: { color: '#64748B', fontSize: 11, marginTop: 2 },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },

  // 카테고리 카드
  categoryRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  categoryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  categoryCount: { color: '#94A3B8', fontSize: 13 },
  categoryArrow: { color: '#3B82F6', fontSize: 13 },
  barBg: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 4 },
  categoryMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  // 주간 추이 그래프
chartArea: {
  flexDirection: 'row',
  height: 140,
  alignItems: 'flex-end',
  paddingHorizontal: 4,
  marginBottom: 8,
},
chartCol: {
  flex: 1,
  alignItems: 'center',
  marginHorizontal: 2,
},
chartBarWrap: {
  flex: 1,
  width: '70%',
  justifyContent: 'flex-end',
  alignItems: 'center',
},
chartBarValue: {
  color: '#F8FAFC',
  fontSize: 11,
  fontWeight: '700',
  marginBottom: 2,
},
chartBar: {
  width: '100%',
  borderTopLeftRadius: 4,
  borderTopRightRadius: 4,
  minHeight: 2,
},
chartLabel: {
  color: '#94A3B8',
  fontSize: 10,
  marginTop: 6,
  textAlign: 'center',
},
chartLabelActive: {
  color: '#3B82F6',
  fontWeight: '700',
},
chartSub: {
  color: '#64748B',
  fontSize: 9,
  marginTop: 2,
},
chartHint: {
  color: '#64748B',
  fontSize: 11,
  textAlign: 'center',
  marginTop: 4,
},

// 누적 통계
totalDaysRow: {
  alignItems: 'center',
  paddingVertical: 12,
  marginBottom: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#0F172A',
},
totalDaysNumber: {
  color: '#F59E0B',
  fontSize: 40,
  fontWeight: '800',
},
totalDaysLabel: {
  color: '#94A3B8',
  fontSize: 13,
  marginTop: 4,
},
subSectionTitle: {
  color: '#94A3B8',
  fontSize: 13,
  fontWeight: '600',
  marginBottom: 10,
  marginTop: 4,
},
topRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  gap: 10,
},
topRank: { fontSize: 18 },
topName: { color: '#F8FAFC', fontSize: 14, flex: 1 },
topCount: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },
prRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  borderTopWidth: 1,
  borderTopColor: '#0F172A',
},
prName: { color: '#F8FAFC', fontSize: 14, flex: 1 },
prRight: { alignItems: 'flex-end' },
prWeight: { color: '#10B981', fontSize: 16, fontWeight: '800' },
prMeta: { color: '#64748B', fontSize: 11, marginTop: 2 },



  // 드릴다운 (Accordion)
  drilldown: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  drilldownTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  drilldownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  drilldownLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    width: 70,
  },
  drilldownBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  drilldownBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  drilldownCount: {
    color: '#94A3B8',
    fontSize: 11,
    width: 70,
    textAlign: 'right',
  },
});
