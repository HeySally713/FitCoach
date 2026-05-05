// src/components/CardioInputForm.tsx
// 운동 종류별 동적 입력 폼 (시간/거리/속도/경사도/횟수 등)

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import {
  calculatePace,
  calculateSpeed,
  calculateCalories,
  getMetByActivity,
  getDisplayUnit,
} from '../utils/calorie';

export interface CardioFields {
  duration?: string;     // 분
  distance?: string;     // km
  speed?: string;        // km/h
  incline?: string;      // %
  jumpCount?: string;    // 줄넘기 횟수
  stepCount?: string;    // 스텝 걸음수
  floorCount?: string;   // 계단 층수
  reps?: string;         // 하이니/점핑잭/버피 횟수
}

interface CardioInputFormProps {
  exerciseName: string;
  fields: CardioFields;
  onChange: (fields: CardioFields) => void;
  userWeightKg: number;
}

/**
 * 운동 종류 → 표시할 입력 필드 매핑
 */
const getFieldConfig = (exerciseName: string) => {
  // 인클라인 트레드밀 (시간+거리+속도+경사도)
  if (exerciseName.includes('인클라인')) {
    return {
      duration: true,
      distance: true,
      speed: true,
      incline: true,
    };
  }
  
  // 트레드밀/사이클/걷기/러닝 (시간+거리+속도)
  if (
    exerciseName.includes('러닝머신') ||
    exerciseName.includes('트레드밀') ||
    exerciseName.includes('사이클') ||
    exerciseName.includes('자전거') ||
    exerciseName.includes('야외') ||
    exerciseName.includes('걷기') ||
    exerciseName.includes('러닝')
  ) {
    return {
      duration: true,
      distance: true,
      speed: true,
    };
  }
  
  // 줄넘기 (시간 + 횟수 선택)
  if (exerciseName.includes('줄넘기')) {
    return { duration: true, jumpCount: true };
  }
  
  // 스텝머신 (시간 + 걸음수 선택)
  if (exerciseName.includes('스텝머신')) {
    return { duration: true, stepCount: true };
  }
  
  // 천국의 계단 (시간 + 층수 선택)
  if (exerciseName.includes('천국') || exerciseName.includes('계단')) {
    return { duration: true, floorCount: true };
  }
  
  // 하이니/점핑잭/버피 (시간 + 횟수 선택)
  if (
    exerciseName.includes('하이니') ||
    exerciseName.includes('점핑잭') ||
    exerciseName.includes('버피') ||
    exerciseName.includes('Burpee') ||
    exerciseName.includes('HIIT')
  ) {
    return { duration: true, reps: true };
  }
  
  // 기본값 (요가 포함): 시간만
  return { duration: true };
};

export const CardioInputForm = ({
  exerciseName,
  fields,
  onChange,
  userWeightKg,
}: CardioInputFormProps) => {
  const config = getFieldConfig(exerciseName);
  
  const update = (key: keyof CardioFields, value: string) => {
    onChange({ ...fields, [key]: value });
  };
  
  // 자동 계산 (라이브 미리보기)
  const durationNum = parseFloat(fields.duration || '0');
  const distanceNum = parseFloat(fields.distance || '0');
  const speedNum = parseFloat(fields.speed || '0');
  const inclineNum = parseFloat(fields.incline || '0');
  
  // 속도 자동 계산 (거리+시간 입력 시)
  const autoSpeed = 
    distanceNum > 0 && durationNum > 0 
      ? calculateSpeed(distanceNum, durationNum) 
      : 0;
  
  // 사용할 속도: 입력값 우선, 없으면 자동
  const effectiveSpeed = speedNum > 0 ? speedNum : autoSpeed;
  
  // MET → 칼로리
  const met = getMetByActivity(exerciseName, effectiveSpeed, inclineNum);
  const calories = 
    durationNum > 0 
      ? calculateCalories(met, userWeightKg, durationNum)
      : 0;
  
  // 페이스 / 속도 표시
  const displayUnit = getDisplayUnit(exerciseName);
  const paceOrSpeed = 
    distanceNum > 0 && durationNum > 0
      ? displayUnit === 'pace'
        ? `${calculatePace(distanceNum, durationNum)} 페이스`
        : `${autoSpeed} km/h`
      : null;
  
  return (
    <View style={styles.container}>
      {/* 시간 (필수) */}
      {config.duration && (
        <FieldRow
          label="⏱️ 시간 (분)"
          value={fields.duration || ''}
          onChange={(v) => update('duration', v)}
          placeholder="30"
          required
        />
      )}
      
      {/* 거리 */}
      {config.distance && (
        <FieldRow
          label="📏 거리 (km)"
          value={fields.distance || ''}
          onChange={(v) => update('distance', v)}
          placeholder="5.0"
        />
      )}
      
      {/* 속도 */}
      {config.speed && (
        <FieldRow
          label="🏃 속도 (km/h)"
          value={fields.speed || ''}
          onChange={(v) => update('speed', v)}
          placeholder={autoSpeed > 0 ? String(autoSpeed) : '8.0'}
          hint={autoSpeed > 0 ? `자동 계산: ${autoSpeed} km/h` : undefined}
        />
      )}
      
      {/* 경사도 */}
      {config.incline && (
        <FieldRow
          label="⛰️ 경사도 (%)"
          value={fields.incline || ''}
          onChange={(v) => update('incline', v)}
          placeholder="0"
        />
      )}
      
      {/* 줄넘기 횟수 */}
      {config.jumpCount && (
        <FieldRow
          label="🪢 횟수 (선택)"
          value={fields.jumpCount || ''}
          onChange={(v) => update('jumpCount', v)}
          placeholder="500"
        />
      )}
      
      {/* 스텝머신 걸음수 */}
      {config.stepCount && (
        <FieldRow
          label="👣 걸음수 (선택)"
          value={fields.stepCount || ''}
          onChange={(v) => update('stepCount', v)}
          placeholder="3000"
        />
      )}
      
      {/* 계단 층수 */}
      {config.floorCount && (
        <FieldRow
          label="🪜 층수 (선택)"
          value={fields.floorCount || ''}
          onChange={(v) => update('floorCount', v)}
          placeholder="20"
        />
      )}
      
      {/* 횟수 (하이니/점핑잭/버피) */}
      {config.reps && (
        <FieldRow
          label="🔁 횟수 (선택)"
          value={fields.reps || ''}
          onChange={(v) => update('reps', v)}
          placeholder="50"
        />
      )}
      
      {/* 라이브 미리보기 */}
      {(durationNum > 0 || distanceNum > 0) && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>📊 자동 계산</Text>
          {paceOrSpeed && (
            <Text style={styles.previewText}>{paceOrSpeed}</Text>
          )}
          {calories > 0 && (
            <Text style={styles.previewCalories}>🔥 약 {calories} kcal</Text>
          )}
          <Text style={styles.previewMet}>MET {met.toFixed(1)}</Text>
        </View>
      )}
    </View>
  );
};

// ===== 입력 필드 한 줄 =====
interface FieldRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

const FieldRow = ({ label, value, onChange, placeholder, required, hint }: FieldRowProps) => (
  <View style={styles.row}>
    <Text style={styles.label}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#475569"
      keyboardType="numeric"
    />
    {hint && <Text style={styles.hint}>{hint}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginVertical: 12,
  },
  row: {
    gap: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  preview: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  previewTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewCalories: {
    color: '#FB923C',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewMet: {
    color: '#64748B',
    fontSize: 11,
  },
});
