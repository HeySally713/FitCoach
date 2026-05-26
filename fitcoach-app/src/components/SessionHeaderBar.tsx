import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { sessionBus } from '../utils/sessionBus';

export const SessionHeaderBar: React.FC = () => {
  const { session, advanceExercise, goToPreviousExercise } = useSession();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) return;
    const startMs = new Date(session.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.startedAt]);

  if (!session) return null;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const total = session.dayPlan.exercises.length;
  const current = session.currentExerciseIndex + 1;
  const canGoBack = session.currentExerciseIndex > 0;
  const canGoNext = session.currentExerciseIndex < total - 1;

  const handlePrev = async () => {
    const prev = await goToPreviousExercise();
    if (prev) {
      const prevEx = prev.dayPlan.exercises[prev.currentExerciseIndex];
      if (prevEx) {
        sessionBus.emit({ type: 'openExercise', exerciseId: prevEx.exerciseId });
      }
    }
  };

  const handleNext = async () => {
    const next = await advanceExercise();
    if (next) {
      const nextEx = next.dayPlan.exercises[next.currentExerciseIndex];
      if (nextEx) {
        sessionBus.emit({ type: 'openExercise', exerciseId: nextEx.exerciseId });
      }
    }
  };

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.timer}>⏱ {mm}:{ss}</Text>
        <Text style={styles.progress}>{current}/{total}</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={!canGoBack}
        >
          <Text style={[styles.navText, !canGoBack && styles.navTextDisabled]}>
            ← 이전
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={!canGoNext}
        >
          <Text style={[styles.navText, !canGoNext && styles.navTextDisabled]}>
            다음 →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timer: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  progress: { color: '#DBEAFE', fontSize: 13, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  navTextDisabled: { color: 'rgba(255,255,255,0.4)' },
});
