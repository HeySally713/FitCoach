import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { RoutineExercise } from '../types/recommendation';
import { getAlternatives } from '../services/recommendation';
import { EXERCISES } from '../data/exerciseDB';

interface SwapModalProps {
  visible: boolean;
  currentExercise: RoutineExercise | null;
  environment: 'gym' | 'home';
  onClose: () => void;
  onSelect: (newExercise: RoutineExercise) => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  visible,
  currentExercise,
  environment,
  onClose,
  onSelect,
}) => {
  const [alternatives, setAlternatives] = useState<RoutineExercise[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (visible && currentExercise) {
      setAlternatives(getAlternatives(currentExercise, environment, 3));
      setSearchMode(false);
      setSearchText('');
    }
  }, [visible, currentExercise, environment]);

  if (!currentExercise) return null;

  // Search mode: all exercises, no environment filter
  const searchResults = searchMode
    ? EXERCISES.filter(e =>
        e.name_ko.toLowerCase().includes(searchText.toLowerCase())
      ).slice(0, 30)
    : [];

  const handlePickFromSearch = (dbEx: typeof EXERCISES[0]) => {
    onSelect({
      exerciseId: dbEx.exercise_id,
      nameKo: dbEx.name_ko,
      category: dbEx.category as any,
      movementPattern: dbEx.movement_pattern,
      sets: currentExercise.sets,
      reps: currentExercise.reps,
      restSec: currentExercise.restSec,
      notes: currentExercise.notes,
      videoId: dbEx.video_id ?? '',
      phase: currentExercise.phase,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {searchMode ? '🔍 운동 검색' : '🔄 운동 바꾸기'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.currentLabel}>
          현재: <Text style={styles.currentName}>{currentExercise.nameKo}</Text>
        </Text>

        {!searchMode ? (
          <>
            <ScrollView style={styles.list}>
              {alternatives.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    대체 가능한 운동이 없어요
                  </Text>
                  <Text style={styles.emptySub}>
                    직접 검색해서 골라보세요
                  </Text>
                </View>
              ) : (
                alternatives.map((alt) => (
                  <TouchableOpacity
                    key={alt.exerciseId}
                    style={styles.card}
                    onPress={() => onSelect(alt)}
                  >
                    <Text style={styles.cardName}>{alt.nameKo}</Text>
                    <Text style={styles.cardMeta}>
                      {alt.sets}세트 × {alt.reps}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.searchBtn}
              onPress={() => setSearchMode(true)}
            >
              <Text style={styles.searchBtnText}>🔍 직접 검색</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="운동 이름 검색..."
              placeholderTextColor="#64748B"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            <ScrollView style={styles.list}>
              {searchResults.map((ex) => (
                <TouchableOpacity
                  key={ex.exercise_id}
                  style={styles.card}
                  onPress={() => handlePickFromSearch(ex)}
                >
                  <Text style={styles.cardName}>{ex.name_ko}</Text>
                  <Text style={styles.cardMeta}>
                    {ex.category} • {ex.difficulty}
                  </Text>
                </TouchableOpacity>
              ))}
              {searchText.length > 0 && searchResults.length === 0 && (
                <Text style={styles.emptyText}>검색 결과 없음</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setSearchMode(false)}
            >
              <Text style={styles.backBtnText}>← 추천 보기</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  closeBtn: { color: '#94A3B8', fontSize: 22, paddingHorizontal: 8 },
  currentLabel: { color: '#94A3B8', fontSize: 14, paddingHorizontal: 16, paddingVertical: 12 },
  currentName: { color: '#F8FAFC', fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardName: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardMeta: { color: '#94A3B8', fontSize: 13 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15, marginBottom: 4 },
  emptySub: { color: '#64748B', fontSize: 13 },
  searchBtn: {
    backgroundColor: '#3B82F6',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  searchInput: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  backBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  backBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});
