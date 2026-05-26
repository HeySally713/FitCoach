
// src/screens/RoutineScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateWeeklyPlan } from '../services/recommendation';
import type { WeeklyPlan, DailyWorkout, RoutineExercise } from '../types/recommendation';
import { getProfile } from '../services/profile';
import { useSession } from '../contexts/SessionContext';
import { navigationRef } from '../utils/navigation';
import { sessionBus } from '../utils/sessionBus';  // we'll create this in Step 4
import { SwapModal } from '../components/SwapModal';
import { Alert } from 'react-native';
import { getActiveSession, clearActiveSession } from '../services/storage';
import { useFocusEffect } from '@react-navigation/native';


type EnvOverride = 'gym' | 'home' | null;

export const RoutineScreen: React.FC = () => {
  const { startSession, session } = useSession();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [today, setToday] = useState<DailyWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [envOverride, setEnvOverride] = useState<EnvOverride>(null);
  const [dayIndex, setDayIndex] = useState(0); // which day of the routine the user is on
  const [swapTarget, setSwapTarget] = useState<RoutineExercise | null>(null);
  const [environment, setEnvironment] = useState<'gym' | 'home'>('gym');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getProfile();
      const effectiveProfile = envOverride
        ? { ...profile, environment: envOverride }
        : profile;
      const generated = generateWeeklyPlan(effectiveProfile);
      setPlan(generated);
      setToday(generated.days[dayIndex] ?? generated.days[0]);
    } catch (e) {
      console.error('[RoutineScreen] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [envOverride, dayIndex]);

  const handleSwapExercise = (newExercise: RoutineExercise) => {
  if (!today || !swapTarget) return;

  const updatedExercises = today.exercises.map(ex =>
    ex.exerciseId === swapTarget.exerciseId ? newExercise : ex
  );

  const updatedDay: DailyWorkout = {
    ...today,
    exercises: updatedExercises,
  };

  setToday(updatedDay);
  setSwapTarget(null);
};


  useEffect(() => { load(); }, [load]);

  useFocusEffect(
  React.useCallback(() => {
    const checkResume = async () => {
      const existing = await getActiveSession();
      if (!existing) return;

      const exercisesTotal = existing.dayPlan.exercises.length;
      const currentIdx = existing.currentExerciseIndex;
      const completedCount = existing.completedExerciseIds.length;

      // Don't prompt if session is already done
      if (currentIdx >= exercisesTotal) {
        await clearActiveSession();
        return;
      }

      const startedDate = new Date(existing.startedAt).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      Alert.alert(
        '진행 중인 운동이 있어요',
        `${startedDate}에 시작\n진행: ${completedCount}/${exercisesTotal}개 완료`,
        [
          {
            text: '새로 시작',
            style: 'destructive',
            onPress: async () => {
              await clearActiveSession();
            },
          },
          {
            text: '이어서 하기',
            onPress: () => {
              const nextEx = existing.dayPlan.exercises[currentIdx];
              if (nextEx) {
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Workout' as never);
                }
                setTimeout(() => {
                  sessionBus.emit({ type: 'openExercise', exerciseId: nextEx.exerciseId });
                }, 300);
              }
            },
          },
        ],
        { cancelable: false }
      );
    };
    checkResume();
  }, [])
);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
      </SafeAreaView>
    );
  }

  if (!today || !plan) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🤖</Text>
          <Text style={styles.emptyTitle}>루틴을 만들 수 없어요</Text>
          <Text style={styles.emptySub}>프로필을 먼저 설정해 주세요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group exercises by phase
  const phases = (['warmup', 'main', 'cardio', 'cooldown'] as const).map((phase) => ({
    phase,
    exercises: today.exercises.filter((ex) => (ex.phase ?? 'main') === phase),
  })).filter((p) => p.exercises.length > 0);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>오늘의 루틴</Text>
          <Text style={styles.headerSub}>이번주 {today.dayLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Environment toggle */}
        <View style={styles.envRow}>
          {(['gym', 'home'] as const).map((env) => (
            <TouchableOpacity
              key={env}
              style={[styles.envChip, envOverride === env && styles.envChipActive]}
              onPress={() => setEnvOverride(envOverride === env ? null : env)}
            >
              <Text style={[styles.envChipText, envOverride === env && styles.envChipTextActive]}>
                {env === 'gym' ? '🏋️ 헬스장' : '🏠 홈'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Day picker */}
        <View style={styles.dayRow}>
          {plan.days.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayChip, dayIndex === i && styles.dayChipActive]}
              onPress={() => { setDayIndex(i); setToday(plan.days[i]); }}
            >
              <Text style={[styles.dayChipText, dayIndex === i && styles.dayChipTextActive]}>
                {d.dayLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryFocus}>{today.focus}</Text>
          <Text style={styles.summaryMeta}>
            ⏱ {today.estimatedDurationMin}분 · 🔥 {today.estimatedCalories} kcal · 🧱 {today.exercises.length}개 운동
          </Text>
        </View>

        {/* Phase sections */}
        {phases.map(({ phase, exercises }) => {
          const cfg = {
            warmup:   { emoji: '🔥', label: '워밍업', color: '#F59E0B' },
            main:     { emoji: '💪', label: '메인 운동', color: '#3B82F6' },
            cardio:   { emoji: '🏃', label: '유산소', color: '#10B981' },
            cooldown: { emoji: '🌿', label: '쿨다운', color: '#8B5CF6' },
          }[phase];
          return (
            <View key={phase} style={styles.phaseBlock}>
              <Text style={[styles.phaseHeader, { color: cfg.color }]}>
                {cfg.emoji} {cfg.label}
              </Text>
{exercises.map((ex, j) => (
  <View key={j} style={styles.exRow}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <View style={styles.exHeader}>
          <Text style={styles.exName}>{j + 1}. {ex.nameKo}</Text>
          <Text style={styles.exCategory}>
            {ex.category === 'gym' ? '🏋️' :
             ex.category === 'home' ? '🏠' :
             ex.category === 'cardio' ? '🏃' :
             ex.category === 'warmup' ? '🔥' :
             ex.category === 'cooldown' ? '🌿' : '🧘'}
          </Text>
        </View>
        <Text style={styles.exMeta}>
          {ex.sets}세트 × {ex.reps}
          {ex.restSec > 0 ? ` · 휴식 ${ex.restSec}초` : ''}
        </Text>
        {ex.notes && <Text style={styles.exNote}>💡 {ex.notes}</Text>}
      </View>
      <TouchableOpacity
        style={styles.swapBtn}
        onPress={() => setSwapTarget(ex)}
      >
        <Text style={styles.swapBtnText}>🔄</Text>
      </TouchableOpacity>
    </View>
  </View>
))}
            </View>
          );
        })}

        {/* Start button (placeholder — wired in Phase 3) */}

          <TouchableOpacity
            style={styles.startBtn}
            onPress={async () => {
              if (!today) return;
              // If there's already an active session, ask resume vs restart (later in Phase 3C)
              // For now: clear and start fresh
              const newSession = await startSession(dayIndex, today);
              const firstEx = newSession.dayPlan.exercises[0];
              if (firstEx) {
                // Switch to 운동검색 tab and open the first exercise
                if (navigationRef.isReady()) {
                  navigationRef.navigate('Workout' as never);
                }
                // Wait for WorkoutScreen to mount and subscribe before emitting
                  setTimeout(() => {  
                // Tell WorkoutScreen which exercise to open
                sessionBus.emit({ type: 'openExercise', exerciseId: firstEx.exerciseId });
                  }, 300);
              }
            }}
          >
            <Text style={styles.startBtnText}>▶ 시작하기</Text>
          </TouchableOpacity>


        <View style={{ height: 40 }} />
      </ScrollView>
       <SwapModal
        visible={swapTarget !== null}
        currentExercise={swapTarget}
        environment={envOverride ?? 'gym'}
        onClose={() => setSwapTarget(null)}
        onSelect={handleSwapExercise}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: '#94A3B8', fontSize: 14 },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  headerSub: { color: '#94A3B8', fontSize: 14, marginTop: 4 },

  body: { padding: 16, paddingBottom: 40 },

  envRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  envChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  envChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  envChipText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  envChipTextActive: { color: '#FFFFFF' },

  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: '#1E293B',
  },
  dayChipActive: { backgroundColor: '#F59E0B' },
  dayChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  dayChipTextActive: { color: '#0F172A' },

  summaryCard: {
    backgroundColor: '#1E293B',
    padding: 16, borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: '#3B82F6',
  },
  summaryFocus: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  summaryMeta: { color: '#CBD5E1', fontSize: 13 },

  phaseBlock: { marginBottom: 16 },
  phaseHeader: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  exRow: {
    backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 8,
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { color: '#F8FAFC', fontSize: 15, fontWeight: '600', flex: 1 },
  exCategory: { fontSize: 18, marginLeft: 8 },
  exMeta: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  exNote: { color: '#FBBF24', fontSize: 12, marginTop: 4 },

  startBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 20,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  swapBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#334155',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 8,
},
swapBtnText: { fontSize: 16 },

});
