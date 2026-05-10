// src/screens/HistoryScreen.tsx
// 운동 기록 히스토리 - 시간순 그룹 리스트

import React, { useCallback, useState } from 'react';
import { SessionDetailModal } from './SessionDetailModal';
import { deleteExerciseFromSession, getSessionByDate } from '../services/storage';
import { WorkoutSession, WorkoutExercise, BODY_PART_EMOJI, BodyPart } from '../types/workout';
// Exercise import 제거

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import { groupSessionsByPeriod, formatRelativeDate } from '../utils/dateGroup';
//import { inferSessionBodyPart, getBodyPartEmoji } from '../utils/bodyPart';


/**
 * 세션 내 운동들의 부위를 종합해서 라벨 문자열 생성
 * - 모두 같은 부위: "💪 가슴 운동"
 * - 여러 부위: "💪 가슴 · 🦵 하체"
 * - 미분류 포함: "💪 가슴 · ⚪️ 미분류"
 * - 모두 미분류: "⚪️ 미분류"
 */
const buildBodyPartLabel = (
  exercises: { bodyPart?: BodyPart; equipmentType?: string }[]
): string => {
  const parts = new Set<string>();
  let hasUnclassified = false;

  exercises.forEach((e) => {
    // cardio 운동은 bodyPart 없어도 '유산소'로 자동 분류
    if (!e.bodyPart && e.equipmentType === 'cardio') {
      parts.add(`${BODY_PART_EMOJI['유산소']} 유산소`);
    } else if (e.bodyPart) {
      parts.add(`${BODY_PART_EMOJI[e.bodyPart]} ${e.bodyPart}`);
    } else {
      hasUnclassified = true;
    }
  });

  const labels = Array.from(parts);
  if (hasUnclassified) {
    labels.push('⚪️ 미분류');
  }

  if (labels.length === 0) return '⚪️ 미분류';
  if (labels.length === 1 && !hasUnclassified) {
    return `${labels[0]} 운동`;
  }
  return labels.join(' · ');
};


export const HistoryScreen = () => {
  const { sessions, loading, error, refresh } = useWorkoutHistory();
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);


  // 화면에 진입할 때마다 새로고침 (다른 탭에서 운동 기록 후 돌아오면 반영)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleEditExercise = (exercise:  WorkoutExercise) => {
  Alert.alert(
    '편집 기능',
    `${exercise.exerciseName} 편집은 다음 업데이트에 추가됩니다.\n현재는 운동 탭에서 같은 운동 다시 기록하면 누적됩니다.`,
    [{ text: '확인' }]
  );
};



  const handleDeleteExercise = async (exerciseId: string) => {
    if (!selectedSession) return;
    await deleteExerciseFromSession(selectedSession.date, exerciseId);
    await refresh();
      // 정적 import 사용
  const updated = await getSessionByDate(selectedSession.date);
  setSelectedSession(updated);
};


  
  // 로딩 상태
  if (loading && sessions.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 빈 상태
  if (sessions.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 기록</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📓</Text>
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.emptySub}>
            첫 운동을 시작해 기록을 남겨보세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 정상 상태
  const groups = groupSessionsByPeriod(sessions);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 기록</Text>
        <Text style={styles.headerSub}>{sessions.length}일의 운동 기록</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#3B82F6" />
        }
      >
        {groups.map((group, gIdx) => (
          <View key={gIdx} style={styles.group}>
            {/* 그룹 헤더 */}
            <View style={styles.groupHeader}>
              <Text style={styles.groupLabel}>📅 {group.label}</Text>
              {group.sublabel && (
                <Text style={styles.groupSublabel}>{group.sublabel}</Text>
              )}
            </View>

{group.sessions.map((session) => (
  <SessionCard 
    key={session.sessionId} 
    session={session}
    onPress={() => setSelectedSession(session)}
  />
))}
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 세션 상세 모달 추가 */}
      <SessionDetailModal
        session={selectedSession}
        visible={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
        onEditExercise={handleEditExercise}
        onDeleteExercise={handleDeleteExercise}
      />
    </SafeAreaView>
  );
};

// ===== 세션 카드 =====
interface SessionCardProps {
  session: WorkoutSession;
  onPress?: () => void;  
}

const SessionCard = ({ session, onPress }: SessionCardProps) => {
  const bodyPartLabel = buildBodyPartLabel(session.exercises);
  
  // 총 세트 수 (weight 운동만, cardio는 1세트로 카운트 안 함)
  const totalSets = session.exercises.reduce((sum, ex) => {
    if (ex.equipmentType === 'cardio') return sum;
    return sum + ex.sets.length;
  }, 0);
  
  // 총 칼로리 (cardio만)
  const totalCalories = session.exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((s, set) => s + (set.calories || 0), 0);
  }, 0);
  
  // 총 운동 시간 (cardio만, 분 단위)
  const totalDuration = session.exercises.reduce((sum, ex) => {
    if (ex.equipmentType !== 'cardio') return sum;
    return sum + ex.sets.reduce((s, set) => s + (set.duration || 0), 0);
  }, 0);
  
  const isToday = formatRelativeDate(session.date).startsWith('오늘');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, isToday && styles.cardToday]}
    >
      {isToday && <View style={styles.cardAccent} />}
      <View style={styles.cardContent}>
        <Text style={styles.cardDate}>{formatRelativeDate(session.date)}</Text>
        <Text style={styles.cardTitle}>
          {bodyPartLabel} · {session.exercises.length}개 종목
        </Text>
        <View style={styles.exerciseList}>
          {session.exercises.map((ex, idx) => {
            const isCardio = ex.equipmentType === 'cardio';
            // cardio: 시간/거리 표시
            if (isCardio && ex.sets.length > 0) {
              const set = ex.sets[0];
              const parts: string[] = [];
              if (set.duration) parts.push(`${set.duration}분`);
              if (set.distance) parts.push(`${set.distance}km`);
              if (set.calories) parts.push(`🔥${set.calories}kcal`);
              return (
                <Text key={idx} style={styles.exerciseLine}>
                  • {ex.exerciseName} · {parts.join(' · ')}
                </Text>
              );
            }
            // weight: 세트 수
            return (
              <Text key={idx} style={styles.exerciseLine}>
                • {ex.exerciseName} · {ex.sets.length}세트
              </Text>
            );
          })}
        </View>
        {/* 메타 정보 - 세트수 + 시간 + 칼로리 */}
        <Text style={styles.cardMeta}>
          {totalSets > 0 && `🕐 총 ${totalSets}세트`}
          {totalSets > 0 && totalDuration > 0 && '  ·  '}
          {totalDuration > 0 && `⏱ ${totalDuration}분`}
          {(totalSets > 0 || totalDuration > 0) && totalCalories > 0 && '  ·  '}
          {totalCalories > 0 && `🔥 ${totalCalories}kcal`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};



// ===== 스타일 =====
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // 헤더
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
  },
  headerSub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  // 리스트
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },

  // 그룹
  group: {
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  groupLabel: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  groupSublabel: {
    color: '#64748B',
    fontSize: 13,
  },

  // 카드
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardToday: {
    borderColor: '#3B82F6',
  },
  cardAccent: {
    width: 4,
    backgroundColor: '#3B82F6',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardDate: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  exerciseList: {
    marginBottom: 8,
  },
  exerciseLine: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  cardMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },

  // 빈 상태
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },

  // 에러 상태
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
