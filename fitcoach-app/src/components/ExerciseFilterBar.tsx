// src/components/ExerciseFilterBar.tsx
import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ExerciseLevel } from '../types/exercise';
import { EQUIPMENT_LABELS } from '../utils/exerciseAdapter';

interface Props {
  searchText: string;
  onSearchChange: (s: string) => void;
  selectedEquipment: string | null;
  onEquipmentChange: (eq: string | null) => void;
  selectedLevel: ExerciseLevel | null;
  onLevelChange: (lv: ExerciseLevel | null) => void;
  availableEquipment: string[];   // unique equipment values present in current category
  resultCount: number;
}

const LEVELS: ExerciseLevel[] = ['초급', '중급', '고급'];

export const ExerciseFilterBar: React.FC<Props> = ({
  searchText, onSearchChange,
  selectedEquipment, onEquipmentChange,
  selectedLevel, onLevelChange,
  availableEquipment, resultCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        value={searchText}
        onChangeText={onSearchChange}
        placeholder="🔍 운동명, 근육 검색 (예: 스쿼트, 가슴, squat)"
        placeholderTextColor="#64748B"
      />

      {/* Equipment chips */}
      {availableEquipment.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <Chip
            label="전체"
            active={selectedEquipment === null}
            onPress={() => onEquipmentChange(null)}
          />
          {availableEquipment.map(eq => (
            <Chip
              key={eq}
              label={EQUIPMENT_LABELS[eq] ?? eq}
              active={selectedEquipment === eq}
              onPress={() => onEquipmentChange(selectedEquipment === eq ? null : eq)}
            />
          ))}
        </ScrollView>
      )}

      {/* Difficulty chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Chip
          label="모든 난이도"
          active={selectedLevel === null}
          onPress={() => onLevelChange(null)}
        />
        {LEVELS.map(lv => (
          <Chip
            key={lv}
            label={lv}
            active={selectedLevel === lv}
            onPress={() => onLevelChange(selectedLevel === lv ? null : lv)}
          />
        ))}
      </ScrollView>

      {/* Result count */}
      <Text style={styles.count}>{resultCount}개 운동</Text>
    </View>
  );
};

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}
const Chip: React.FC<ChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#0F172A',
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  count: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
