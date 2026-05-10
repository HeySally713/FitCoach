// src/screens/MyPageScreen.tsx
// 마이페이지 - 프로필 입력, 스트릭 배지, 통계

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfile, saveProfile } from '../services/profile';
import {
  UserProfile,
  FitnessGoal,
  ExperienceLevel,
  WorkoutEnvironment,
  FITNESS_GOAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  ENVIRONMENT_OPTIONS,
  GENDER_OPTIONS,
} from '../types/profile';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import { calculateStreak, didWorkoutToday } from '../utils/streak';
import { exportAllData } from '../utils/dataBackup';

export const MyPageScreen = () => {
  const { sessions, loading: sessionsLoading } = useWorkoutHistory();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // 입력 폼 state (string으로 받아서 저장 시 number 변환)
  const [weightStr, setWeightStr] = useState('');
  const [heightStr, setHeightStr] = useState('');
  const [birthYearStr, setBirthYearStr] = useState('');
  const [targetWeightStr, setTargetWeightStr] = useState('');
  const [sessionDurationStr, setSessionDurationStr] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | undefined>();
  const [goal, setGoal] = useState<FitnessGoal | undefined>();
  const [experience, setExperience] = useState<ExperienceLevel | undefined>();
  const [weeklyFrequency, setWeeklyFrequency] = useState<number | undefined>();
  const [environments, setEnvironments] = useState<WorkoutEnvironment[]>([]);

  // 프로필 로드
  useEffect(() => {
    (async () => {
      const p = await getProfile();
      setProfile(p);
      setWeightStr(String(p.weightKg));
      setHeightStr(p.heightCm ? String(p.heightCm) : '');
      setBirthYearStr(p.birthYear ? String(p.birthYear) : '');
      setTargetWeightStr(p.targetWeightKg ? String(p.targetWeightKg) : '');
      setSessionDurationStr(p.sessionDurationMin ? String(p.sessionDurationMin) : '');
      setGender(p.gender);
      setGoal(p.goal);
      setExperience(p.experience);
      setWeeklyFrequency(p.weeklyFrequency);
      setEnvironments(p.environments ?? []);
    })();
  }, []);

  const streak = calculateStreak(sessions);
  const todayDone = didWorkoutToday(sessions);

  const toggleEnvironment = (env: WorkoutEnvironment) => {
    setEnvironments((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]
    );
  };

  const handleSave = useCallback(async () => {
    const weightNum = parseFloat(weightStr);
    if (!weightNum || weightNum < 20 || weightNum > 300) {
      Alert.alert('체중 확인', '체중을 20~300 kg 사이로 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const updated = await saveProfile({
        weightKg: weightNum,
        heightCm: heightStr ? parseFloat(heightStr) : undefined,
        birthYear: birthYearStr ? parseInt(birthYearStr, 10) : undefined,
        targetWeightKg: targetWeightStr ? parseFloat(targetWeightStr) : undefined,
        sessionDurationMin: sessionDurationStr ? parseInt(sessionDurationStr, 10) : undefined,
        gender,
        goal,
        experience,
        weeklyFrequency,
        environments,
      });
      setProfile(updated);
      Alert.alert('✅ 저장 완료', '프로필이 업데이트되었습니다.');
    } catch (e) {
      Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }, [
    weightStr, heightStr, birthYearStr, targetWeightStr, sessionDurationStr,
    gender, goal, experience, weeklyFrequency, environments,
  ]);

  if (!profile || sessionsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>마이페이지</Text>

        {/* 스트릭 카드 */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>일 연속 운동</Text>
          {!todayDone && streak > 0 && (
            <Text style={styles.streakHint}>오늘 운동하면 {streak + 1}일!</Text>
          )}
          {streak === 0 && (
            <Text style={styles.streakHint}>오늘 운동하고 스트릭 시작하세요!</Text>
          )}
        </View>


        <TouchableOpacity
          style={{
            backgroundColor: '#475569',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 12,
          }}
          onPress={handleBackup}
        >
          <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>💾 데이터 백업</Text>
        </TouchableOpacity>

        {/* 기본 정보 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 기본 정보</Text>

          <Text style={styles.label}>체중 (kg) *</Text>
          <TextInput
            style={styles.input}
            value={weightStr}
            onChangeText={setWeightStr}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>키 (cm)</Text>
          <TextInput
            style={styles.input}
            value={heightStr}
            onChangeText={setHeightStr}
            keyboardType="numeric"
            placeholder="170"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>출생 연도</Text>
          <TextInput
            style={styles.input}
            value={birthYearStr}
            onChangeText={setBirthYearStr}
            keyboardType="numeric"
            placeholder="1995"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>성별</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, gender === g.value && styles.chipSelected]}
                onPress={() => setGender(gender === g.value ? undefined : g.value)}
              >
                <Text
                  style={[styles.chipText, gender === g.value && styles.chipTextSelected]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 목표 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 운동 목표</Text>

          <Text style={styles.label}>주된 목표</Text>
          <View style={styles.chipRow}>
            {FITNESS_GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.chip, goal === g.value && styles.chipSelected]}
                onPress={() => setGoal(goal === g.value ? undefined : g.value)}
              >
                <Text
                  style={[styles.chipText, goal === g.value && styles.chipTextSelected]}
                >
                  {g.emoji} {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>목표 체중 (kg)</Text>
          <TextInput
            style={styles.input}
            value={targetWeightStr}
            onChangeText={setTargetWeightStr}
            keyboardType="numeric"
            placeholder="65"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>주 운동 빈도</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.chip, weeklyFrequency === n && styles.chipSelected]}
                onPress={() => setWeeklyFrequency(weeklyFrequency === n ? undefined : n)}
              >
                <Text
                  style={[
                    styles.chipText,
                    weeklyFrequency === n && styles.chipTextSelected,
                  ]}
                >
                  {n}회
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>회당 시간 (분)</Text>
          <TextInput
            style={styles.input}
            value={sessionDurationStr}
            onChangeText={setSessionDurationStr}
            keyboardType="numeric"
            placeholder="60"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>경험 수준</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_OPTIONS.map((lv) => (
              <TouchableOpacity
                key={lv}
                style={[styles.chip, experience === lv && styles.chipSelected]}
                onPress={() => setExperience(experience === lv ? undefined : lv)}
              >
                <Text
                  style={[
                    styles.chipText,
                    experience === lv && styles.chipTextSelected,
                  ]}
                >
                  {lv}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>운동 환경 (복수 선택)</Text>
          <View style={styles.chipRow}>
            {ENVIRONMENT_OPTIONS.map((env) => (
              <TouchableOpacity
                key={env.value}
                style={[
                  styles.chip,
                  environments.includes(env.value) && styles.chipSelected,
                ]}
                onPress={() => toggleEnvironment(env.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    environments.includes(env.value) && styles.chipTextSelected,
                  ]}
                >
                  {env.emoji} {env.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? '저장 중...' : '💾 저장'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const handleBackup = async () => {
  try {
    const bundle = await exportAllData();
    const json = JSON.stringify(bundle, null, 2);

    // Log to terminal (visible in `expo start` output)
    console.log('========== FITCOACH BACKUP START ==========');
    console.log(json);
    console.log('========== FITCOACH BACKUP END ==========');

    // Also try the native share sheet so you can save to Files/Email/etc.
    try {
      await Share.share({
        message: json,
        title: `FitCoach Backup ${new Date().toISOString().slice(0,10)}`,
      });
    } catch {
      // Share unavailable — fall back to alert with summary
    }

    const keyCount = Object.keys(bundle.data).length;
    const sessionCount = (bundle.data['@FitCoach/workoutSessions'] as any[])?.length ?? 0;
    Alert.alert(
      '백업 완료 ✅',
      `${keyCount}개 키 / ${sessionCount}개 세션 내보냄.\n\n터미널 로그를 복사해 안전한 곳에 저장하세요.`,
    );
  } catch (e) {
    console.error('[Backup] error:', e);
    Alert.alert('백업 실패', String(e));
  }
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 16 },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  streakEmoji: { fontSize: 48 },
  streakNumber: {
    color: '#F59E0B',
    fontSize: 48,
    fontWeight: '800',
    marginTop: 4,
  },
  streakLabel: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  streakHint: { color: '#94A3B8', fontSize: 13, marginTop: 8 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  chipText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

