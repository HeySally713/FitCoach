// src/components/RestTimer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';

interface RestTimerProps {
  /** Initial rest duration in seconds */
  initialSec: number;
  /** Called when timer reaches 0 or user dismisses */
  onComplete: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({ initialSec, onComplete }) => {
  const [remaining, setRemaining] = useState(initialSec);
  const completedRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        Vibration.vibrate([0, 200, 100, 200]); // double buzz
        // Auto-dismiss after a short pause so the user sees "0:00"
        setTimeout(() => onComplete(), 500);
      }
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onComplete]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const isDone = remaining <= 0;

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>
      <View style={styles.row}>
        <Text style={styles.label}>{isDone ? '✅ 휴식 끝!' : '⏱ 다음 세트까지'}</Text>
        <Text style={styles.timer}>{mm}:{ss}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setRemaining((r) => r + 30)}
          disabled={isDone}
        >
          <Text style={styles.btnText}>+30초</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={onComplete}
        >
          <Text style={[styles.btnText, styles.btnTextPrimary]}>
            {isDone ? '확인' : '건너뛰기'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  cardDone: { borderColor: '#10B981' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  timer: { color: '#F59E0B', fontSize: 22, fontWeight: '800' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#3B82F6' },
  btnText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  btnTextPrimary: { color: '#FFFFFF' },
});
