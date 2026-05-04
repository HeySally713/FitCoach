// src/screens/SessionDetailModal.tsx
// 운동 세션 상세 모달 - 운동별 세트 테이블 + 편집/삭제 액션

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { WorkoutSession, BODY_PART_EMOJI, BodyPart, WorkoutExercise } from '../types/workout';
import { formatRelativeDate } from '../utils/dateGroup';

interface SessionDetailModalProps {
  visible: boolean;
  session: WorkoutSession | null;
  onClose: () => void;
  onEditExercise: (exercise: WorkoutExercise) => void;  // ← 변경
  onDeleteExercise: (exerciseId: string) => Promise<void>;
}

export const SessionDetailModal = ({
  visible,
  session,
  onClose,
  onEditExercise,
  onDeleteExercise,
}: SessionDetailModalProps) => {
  if (!session) return null;

  const handleDelete = (exerciseId: string, exerciseName: string) => {
    Alert.alert(
      '운동 삭제',
      `${exerciseName} 기록을 삭제할까요? 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await onDeleteExercise(exerciseId);
          },
        },
      ]
    );
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              {formatRelativeDate(session.date)}
            </Text>
            <Text style={styles.headerSub}>
              {session.exercises.length}개 종목 ·{' '}
              {session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)}세트
            </Text>
          </View>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {session.exercises.map((ex, idx) => {
            const bodyPart = ex.bodyPart;
            const emoji = bodyPart ? BODY_PART_EMOJI[bodyPart] : '⚪️';

            return (
              <View key={`${ex.exerciseId}-${idx}`} style={styles.exerciseBlock}>
                {/* 운동 헤더 */}
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                    <Text style={styles.exerciseBodyPart}>
                      {emoji} {bodyPart ?? '미분류'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onEditExercise(ex)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(ex.exerciseId, ex.exerciseName)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* 세트 테이블 */}
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>세트</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>무게(kg)</Text>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>횟수</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>✓</Text>
                  </View>
                  {ex.sets.map((s) => (
                    <View key={s.setNumber} style={styles.tableRow}>
                      <Text style={[styles.cell, { flex: 1 }]}>{s.setNumber}</Text>
                      <Text style={[styles.cell, { flex: 2 }]}>
                        {s.weight > 0 ? s.weight : '-'}
                      </Text>
                      <Text style={[styles.cell, { flex: 2 }]}>{s.reps}</Text>
                      <Text style={[styles.cell, { flex: 1, color: '#10B981' }]}>
                        {s.completed ? '✓' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  closeBtn: {
    backgroundColor: '#1E293B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#94A3B8', fontSize: 13, marginTop: 2 },

  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  exerciseBlock: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  exerciseName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  exerciseBodyPart: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  actionBtn: {
    backgroundColor: '#0F172A',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 16 },

  table: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  tableHeaderText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cell: {
    color: '#F8FAFC',
    fontSize: 14,
    textAlign: 'center',
  },
});
