// src/components/SessionHeaderBar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { sessionBus } from '../utils/sessionBus';

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const SessionHeaderBar: React.FC = () => {
  const { session, advanceExercise, markCurrentCompleted } = useSession();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!session) return null;

  const elapsed = now - new Date(session.startedAt).getTime();
  const current = session.dayPlan.exercises[session.currentExerciseIndex];
  const total = session.dayPlan.exercises.length;
  const isLast = session.currentExerciseIndex >= total - 1;

  const handleNext = async () => {
    await markCurrentCompleted();
    const next = await advanceExercise();
    if (!next) {
      // Session finished — handled in Phase 3C
      console.log('[Session] All exercises done');
      return;
    }
    const nextEx = next.dayPlan.exercises[next.currentExerciseIndex];
    if (nextEx) {
      sessionBus.emit({ type: 'openExercise', exerciseId: nextEx.exerciseId });
    }
  };

  const handleSkip = async () => {
    const next = await advanceExercise();
    if (!next) {
      console.log('[Session] All exercises done');
      return;
    }
    const nextEx = next.dayPlan.exercises[next.currentExerciseIndex];
    if (nextEx) {
      sessionBus.emit({ type: 'openExercise', exerciseId: nextEx.exerciseId });
    }
  };

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Text style={styles.timer}>⏱ {formatElapsed(elapsed)}</Text>
        <Text style={styles.progress}>
          {session.currentExerciseIndex + 1} / {total}
        </Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? '✓ 완료' : '다음 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1E3A8A',
    borderBottomWidth: 1,
    borderBottomColor: '#3B82F6',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timer: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  progress: { color: '#BFDBFE', fontSize: 13, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skipBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  skipText: { color: '#BFDBFE', fontSize: 13, fontWeight: '600' },
  nextBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
