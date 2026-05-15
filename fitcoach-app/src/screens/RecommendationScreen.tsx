// src/screens/RecommendationScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfile } from '../services/profile';
import { generateWeeklyPlan, getISOWeek } from '../services/recommendation';
import { WeeklyPlan } from '../types/recommendation';

interface Props {
  onClose?: () => void;
  onSelectExercise?: (exerciseId: string) => void;
}

const SPLIT_LABELS: Record<string, string> = {
  full_body: '전신 분할',
  upper_lower: '상하체 분할',
  push_pull_legs: 'PPL 분할 (Push·Pull·Legs)',
  cardio_focus: '유산소 중심',
  flexibility_focus: '유연성 중심',
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss: '🔥 체중감소',
  muscle_gain: '💪 근육증가',
  health: '❤️ 건강관리',
  endurance: '🏃 체력향상',
  flexibility: '🧘 유연성/자세',
  maintenance: '⚖️ 현상유지',
};

export const RecommendationScreen: React.FC<Props> = ({ onClose, onSelectExercise }) => {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const generate = useCallback(async (manual = false) => {
  setLoading(true);
  setError(null);
  try {
    const profile = await getProfile();
    if (!profile.goal) {
      setError('마이페이지에서 운동 목표를 먼저 설정해주세요.');
      setPlan(null);
      return;
    }
    const generated = generateWeeklyPlan(profile, { manualReroll: manual });
    setPlan(generated);
  } catch (e) {
    console.error('[Recommendation] generate error:', e);
    setError('추천을 생성하지 못했습니다. 다시 시도해주세요.');
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  generate(false);   // initial load uses weekly seed
}, [generate]);


  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>루틴 생성 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>📋 주간 운동 루틴</Text>
          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error ?? '추천 생성 실패. 프로필을 먼저 설정해주세요.'}
          </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => generate(false)}>
              <Text style={styles.retryText}>🔄 다시 시도</Text>
            </TouchableOpacity>

        </View>
      </SafeAreaView>
    );
  }

  // Main view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>📋 주간 운동 루틴</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.regenBtn} onPress={() => generate(true)}>
            <Text style={styles.regenText}>🔄 재생성</Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryRow}>
            🎯 목표: <Text style={styles.summaryValue}>{GOAL_LABELS[plan.goal] ?? plan.goal}</Text>
          </Text>
          <Text style={styles.summaryRow}>
            📅 주 <Text style={styles.summaryValue}>{plan.weeklyFrequency}회</Text> ·{' '}
            <Text style={styles.summaryValue}>{SPLIT_LABELS[plan.splitType] ?? plan.splitType}</Text>
          </Text>
          <Text style={styles.summarySub}>
            예상 총 시간: {plan.days.reduce((s, d) => s + d.estimatedDurationMin, 0)}분 / 주
          </Text>
          <Text style={styles.summarySub}>
            예상 총 칼로리: {plan.days.reduce((s, d) => s + d.estimatedCalories, 0)} kcal / 주
          </Text>
          <Text style={styles.summarySub}>
          📆 {new Date().getFullYear()}년 {getISOWeek(new Date())}주차 루틴
          </Text>

        </View>

        {/* Days */}
        {onSelectExercise && (
          <Text style={styles.hint}>💡 운동을 탭하면 바로 기록할 수 있어요</Text>
        )}
        {plan.days.map((day, i) => (
          <View key={i} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>이번주 {day.dayLabel}</Text>
              <Text style={styles.dayFocus}>{day.focus}</Text>
            </View>
            <Text style={styles.dayMeta}>
              ⏱ {day.estimatedDurationMin}분 · 🔥 {day.estimatedCalories} kcal
            </Text>
            {day.exercises.length === 0 ? (
              <Text style={styles.emptyText}>해당 조건에 맞는 운동이 없습니다.</Text>
            ) : (
              day.exercises.map((ex, j) => (
                <TouchableOpacity
                  key={j}
                  style={styles.exRow}
                  onPress={() => onSelectExercise?.(ex.exerciseId)}
                  activeOpacity={onSelectExercise ? 0.6 : 1}
                  disabled={!onSelectExercise}
                >
                  <View style={styles.exHeader}>
                    <Text style={styles.exName}>
                      {j + 1}. {ex.nameKo}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.exCategory}>
                        {ex.category === 'gym' ? '🏋️' :
                          ex.category === 'home' ? '🏠' :
                          ex.category === 'cardio' ? '🏃' :
                          ex.category === 'warmup' ? '🔥' :
                          ex.category === 'cooldown' ? '🌿' : '🧘'}
                      </Text>
                      {onSelectExercise && (
                        <Text style={{ color: '#3B82F6', fontSize: 14, marginLeft: 6, fontWeight: '700' }}>›</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.exMeta}>
                    {ex.sets}세트 × {ex.reps}
                    {ex.restSec > 0 ? ` · 휴식 ${ex.restSec}초` : ''}
                  </Text>
                  {ex.notes && <Text style={styles.exNote}>💡 {ex.notes}</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}

        {/* Notes */}
        {plan.notes.length > 0 && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>📌 운동 가이드</Text>
            {plan.notes.map((n, i) => (
              <Text key={i} style={styles.noteItem}>
                • {n}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          생성: {new Date(plan.generatedAt).toLocaleString('ko-KR')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  errorText: { color: '#F87171', textAlign: 'center', fontSize: 15, marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  title: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', flex: 1, },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  regenBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    flexShrink: 0,  
  },
  regenText: { color: '#F8FAFC', fontWeight: '600', fontSize: 13 },
  closeBtn: {
    backgroundColor: '#475569',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  closeText: { color: '#F8FAFC', fontWeight: '700', fontSize: 16 },

  scroll: { padding: 16, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  summaryRow: { color: '#CBD5E1', fontSize: 14, marginVertical: 3 },
  summaryValue: { color: '#F8FAFC', fontWeight: '700' },
  summarySub: { color: '#94A3B8', fontSize: 12, marginTop: 6 },

  dayCard: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: { color: '#3B82F6', fontSize: 16, fontWeight: '700' },
  dayFocus: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  dayMeta: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },

  exRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { color: '#F8FAFC', fontSize: 14, fontWeight: '500', flex: 1 },
  exCategory: { fontSize: 14, marginLeft: 8 },
  exMeta: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  exNote: { color: '#FBBF24', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  hint: {
  color: '#94A3B8',
  fontSize: 12,
  textAlign: 'center',
  marginBottom: 10,
  fontStyle: 'italic',
},

  notesCard: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
  },
  notesTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteItem: {
    color: '#CBD5E1',
    fontSize: 13,
    marginVertical: 3,
    lineHeight: 18,
  },

  footer: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});
