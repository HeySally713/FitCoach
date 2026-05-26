import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { ExerciseFilterBar } from './src/components/ExerciseFilterBar';
import { EXERCISES_BY_CATEGORY, EXERCISES_BY_CATEGORY_SEARCHABLE, ExerciseSearchable, ALL_EXERCISES } from './src/utils/exerciseAdapter';
import { Exercise, CARDIO_DURATIONS, CardioDuration, ExerciseLevel } from './src/types/exercise';
import React, { useState, useEffect, useMemo } from 'react';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Image, ActivityIndicator,
  Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useExerciseVideos } from './src/hooks/useExerciseVideos';
import { ExerciseVideo, SearchVideosParams } from './src/services/youtube';
import { 
  saveExercise, 
  getTodayExercise, 
  upsertTodayExercise,
  getRecentBodyPart,           // ← 추가
} from './src/services/storage';
import { CardioInputForm, CardioFields } from './src/components/CardioInputForm';
import { getMetByActivity, calculateCalories, calculatePace } from './src/utils/calorie';
import { 
  BodyPart, 
  BODY_PART_OPTIONS, 
  BODY_PART_EMOJI,
  WorkoutIntensity,
  INTENSITY_OPTIONS,
  INTENSITY_EMOJI,
  INTENSITY_LABEL,
} from './src/types/workout';

import { HistoryScreen } from './src/screens/HistoryScreen';
import { MyPageScreen } from './src/screens/MyPageScreen';
import { getProfile } from './src/services/profile';
import { calculateStreak } from './src/utils/streak';
import { getAllSessions } from './src/services/storage';
import { editBus } from './src/utils/editBus';
import { findExerciseById } from './src/utils/exerciseAdapter';
import { updateExerciseInSession } from './src/services/storage';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RoutineScreen } from './src/screens/RoutineScreen';
import { SessionProvider, useSession } from './src/contexts/SessionContext';
import { sessionBus } from './src/utils/sessionBus';
import { SessionHeaderBar } from './src/components/SessionHeaderBar';
import { RestTimer } from './src/components/RestTimer';


const Tab = createBottomTabNavigator();
import { navigationRef } from './src/utils/navigation';


interface SetState {
  id: number;
  weight: string;
  reps: string;
  done: boolean;
  originalSetNumber?: number; // DB에 이미 저장된 세트면 번호 보유
}



// 🏋️ 운동기록 화면 (메인 기능)
const WorkoutScreen = () => {
const { session, markCurrentCompleted, advanceExercise, endSession } = useSession();
const [searchText, setSearchText] = useState('');
const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
const [selectedLevel, setSelectedLevel] = useState<ExerciseLevel | null>(null);
const [selectedCategory, setSelectedCategory] = useState<string>('gym');
  useEffect(() => {
  setSearchText('');
  setSelectedEquipment(null);
  setSelectedLevel(null);
}, [selectedCategory]);

const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
const [selectedIntensity, setSelectedIntensity] = useState<WorkoutIntensity | null>(null);
const [sets, setSets] = useState<SetState[]>([
    { id: 1, weight: '', reps: '', done: false },
  ]);
const [showRestTimer, setShowRestTimer] = useState(false);

// Step C: 영상 선택 + 카디오 시간 선택 상태
const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
const [cardioDuration, setCardioDuration] = useState<CardioDuration | null>(null);

const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
const [cardioFields, setCardioFields] = useState<CardioFields>({});
const [streak, setStreak] = useState<number>(0);
const [editingContext, setEditingContext] = useState<{ date: string; originalExerciseId: string } | null>(null);

useEffect(() => {
  const unsub = editBus.on(({ date, exercise }) => {
    // Build an Exercise-shaped object from the saved exercise
    const dbExercise = findExerciseById(exercise.exerciseId);
    if (!dbExercise) {
      Alert.alert('알림', '이 운동은 더 이상 DB에 없어 편집할 수 없어요.');
      return;
    }
    // Pre-fill sets from saved data
    setSets(
      exercise.sets.map((s, idx) => ({
        id: idx + 1,
        weight: s.weight != null ? String(s.weight) : '',
        reps: s.reps != null ? String(s.reps) : '',
        done: true,
      }))
    );
    setSelectedBodyPart((exercise.bodyPart as any) ?? null);
    setSelectedIntensity(exercise.intensity ?? null);
    setEditingContext({ date, originalExerciseId: exercise.exerciseId });
    setSelectedExercise(dbExercise);
  });
  return () => { unsub(); };
}, []);
useEffect(() => {
  const unsub = sessionBus.on((event) => {
    if (event.type === 'openExercise') {
      const dbExercise = findExerciseById(event.exerciseId);
      if (!dbExercise) {
        console.warn('[Session] exercise not found:', event.exerciseId);
        return;
      }
      console.log('[Session] Opening next exercise:', dbExercise.name);
      // Reset sets, open modal
      setSets([{ id: 1, weight: '', reps: '', done: false }]);
      setCardioFields({});
      setSelectedBodyPart(null);
      setSelectedIntensity(null);
      setCurrentVideoId(null);
      setCardioDuration(null);
      setSelectedExercise(dbExercise);
      setShowRestTimer(false);
    }
  });
  return () => { unsub(); };
}, []);


// 스트릭 로드 (운동 탭 진입 시)
useFocusEffect(
  React.useCallback(() => {
    (async () => {
      try {
        const sessions = await getAllSessions();
        setStreak(calculateStreak(sessions));
      } catch (e) {
        console.error('[WorkoutScreen] streak 로드 실패:', e);
      }
    })();
  }, [])
);

const [userWeightKg, setUserWeightKg] = useState<number>(70);

// 운동 탭이 포커스될 때마다 최신 프로필 로드 (체중 변경 즉시 반영)
useFocusEffect(
  React.useCallback(() => {
    (async () => {
      try {
        const profile = await getProfile();
        setUserWeightKg(profile.weightKg);
      } catch (e) {
        console.error('[WorkoutScreen] 프로필 로드 실패:', e);
      }
    })();
  }, [])
);



// Step C: YouTube 검색 파라미터 (cardio는 duration 선택 후에만 검색)
const searchParams: SearchVideosParams | null = useMemo(() => {
  if (!selectedExercise) return null;

  // cardio는 duration 선택 전까지 검색 안 함
  if (selectedExercise.equipmentType === 'cardio' && !cardioDuration) {
    return null;
  }

  return {
    exerciseName: selectedExercise.name,
    equipmentType: selectedExercise.equipmentType,
    cardioDuration: cardioDuration ?? undefined,
  };
}, [selectedExercise, cardioDuration]);

// Step C: 영상 검색 훅 사용
const { videos, loading, error } = useExerciseVideos(searchParams);

// Step D: 모달 열 때 오늘 그 운동의 기존 기록 로드
useEffect(() => {
  if (!selectedExercise) return;
  const loadTodayRecord = async () => {
    const todayRecord = await getTodayExercise(selectedExercise.id);
    if (todayRecord && todayRecord.sets.length > 0) {
      const restoredSets = todayRecord.sets.map((s, i) => ({
        id: i + 1,
        weight: String(s.weight),
        reps: String(s.reps),
        done: s.completed,
        originalSetNumber: s.setNumber,
      }));
      setSets([...restoredSets, { id: restoredSets.length + 1, weight: '', reps: '', done: false }]);
      // 오늘 이미 분류된 부위가 있으면 그대로 사용
      setSelectedBodyPart(todayRecord.bodyPart || null);
      setSelectedIntensity(todayRecord.intensity || null);  // ← 추가

    } else {
      setSets([{ id: 1, weight: '', reps: '', done: false }]);
      // 오늘 기록이 없으면 가장 최근 분류한 부위를 자동 선택
      const recentPart = await getRecentBodyPart(selectedExercise.id);
      setSelectedBodyPart(recentPart);
      setSelectedIntensity(null);  // ← 추가
    }
  };
  loadTodayRecord();
}, [selectedExercise]);


// Step C: 영상 결과가 도착하면 첫 번째 영상 자동 선택
useEffect(() => {
  if (videos.length > 0) {
    setCurrentVideoId(videos[0].videoId);
  } else if (selectedExercise?.videoId && !loading) {
    // API 결과 없으면 하드코딩 폴백
    setCurrentVideoId(selectedExercise.videoId);
  } else {
    setCurrentVideoId(null);
  }
}, [videos, loading, selectedExercise]);

  const categories = [
    { key: 'gym', label: '🏋️ 헬스장' },
    { key: 'home', label: '🏠 홈트' },
    { key: 'yoga', label: '🧘 요가' },
    { key: 'cardio', label: '🏃 유산소' },
    { key: 'warmup', label: '🔥 워밍업' },
    { key: 'cooldown', label: '🧘 쿨다운' },

  ];
const exercises: Record<string, Exercise[]> = EXERCISES_BY_CATEGORY;

const sourceExercises: ExerciseSearchable[] = EXERCISES_BY_CATEGORY_SEARCHABLE[selectedCategory] ?? [];

const availableEquipment = Array.from(
  new Set(sourceExercises.map(e => e.equipment))
).sort();

const currentExercises: ExerciseSearchable[] = sourceExercises.filter(e => {
  // search text matches name (ko/en) or any muscle
  if (searchText.trim()) {
    const q = searchText.toLowerCase().trim();
    const haystack = [
      e.name.toLowerCase(),
      e.nameEn.toLowerCase(),
      ...e.primaryMuscles.map(m => m.toLowerCase()),
    ].join(' ');
    if (!haystack.includes(q)) return false;
  }
  // equipment filter
  if (selectedEquipment && e.equipment !== selectedEquipment) return false;
  // level filter
  if (selectedLevel && e.level !== selectedLevel) return false;
  return true;
});



const toggleSetDone = (id: number) => {
  setSets((prev) =>
    prev.map((set) => (set.id === id ? { ...set, done: !set.done } : set))
  );
  // NEW: trigger rest timer when marking done in an active session
  const set = sets.find(s => s.id === id);
  if (set && !set.done && session && selectedExercise?.equipmentType !== 'cardio') {
    setShowRestTimer(true);
  }
};

const updateSet = (id: number, field: 'weight' | 'reps', value: string) => {
  setSets((prev) =>
    prev.map((set) => (set.id === id ? { ...set, [field]: value } : set))
  );
};

const deleteSet = (id: number) => {
  setSets((prev) => {
    if (prev.length <= 1) {
      Alert.alert('알림', '최소 1세트는 유지되어야 합니다.');
      return prev;
    }
    // Filter out and renumber so set.id stays sequential
    const filtered = prev.filter((s) => s.id !== id);
    return filtered.map((s, idx) => ({ ...s, id: idx + 1 }));
  });
};

const copyFromPreviousSet = (id: number) => {
  setSets((prev) => {
    const idx = prev.findIndex((s) => s.id === id);
    if (idx <= 0) return prev; // can't copy for first set
    const prevSet = prev[idx - 1];
    return prev.map((s) =>
      s.id === id
        ? { ...s, weight: prevSet.weight, reps: prevSet.reps }
        : s
    );
  });
};

const addSet = () => {
  setSets((prev) => [
    ...prev,
    { id: prev.length + 1, weight: '', reps: '', done: false },
  ]);
};



  // 모달 닫기 함수
const closeModal = () => {
  setSelectedExercise(null);
  setCurrentVideoId(null);
  setCardioDuration(null);
  setSelectedBodyPart(null); 
  setCardioFields({});  
  setSelectedIntensity(null);  // ← 추가
  setSelectedExercise(null);
  setEditingContext(null);
  setSets([{ id: 1, weight: '', reps: '', done: false }]);
};
// 저장 완료 후: 세션 진행 또는 모달 닫기
const handlePostSaveSuccess = async () => {
  if (session) {
    await markCurrentCompleted();
    const next = await advanceExercise();
    if (!next) {
      Alert.alert(
        '🎉 운동 완료!',
        '오늘의 루틴을 모두 끝냈어요!\n수고하셨습니다 💪',
        [{
          text: '확인',
          onPress: async () => {
            await endSession();
            closeModal();
          },
        }]
      );
      return;
    }
    const nextEx = next.dayPlan.exercises[next.currentExerciseIndex];
    if (nextEx) {
      sessionBus.emit({ type: 'openExercise', exerciseId: nextEx.exerciseId });
    } else {
      closeModal();
    }
  } else {
    closeModal();
  }
};
const getCurrentRestSec = (): number => {
  if (!session || !selectedExercise) return 60;
  const currentEx = session.dayPlan.exercises[session.currentExerciseIndex];
  return currentEx?.restSec ?? 60;
};

// Step D: 운동 완료 - 기록 저장 (upsert: 기존 수정 + 신규 추가)
const handleCompleteWorkout = async () => {
  if (!selectedExercise) return;
    // === Cardio 분기 (시간 기반 운동) ===
  if (selectedExercise.equipmentType === 'cardio') {
    const duration = parseFloat(cardioFields.duration || '0');
    if (duration <= 0) {
      Alert.alert('시간을 입력해주세요', '운동 시간(분)이 필요합니다.', [{ text: '확인' }]);
      return;
    }

    const distance = parseFloat(cardioFields.distance || '0');
    const inputSpeed = parseFloat(cardioFields.speed || '0');
    const incline = parseFloat(cardioFields.incline || '0');
    const effectiveSpeed = inputSpeed > 0
      ? inputSpeed
      : (distance > 0 ? (distance / duration) * 60 : 0);

    const met = getMetByActivity(selectedExercise.name, effectiveSpeed, incline);
    const calories = calculateCalories(met, userWeightKg, duration);
    const pace = distance > 0 ? calculatePace(distance, duration) : undefined;

    try {
      const cardioPayload = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        category: selectedExercise.category,
        equipmentType: selectedExercise.equipmentType,
        bodyPart: selectedBodyPart || '유산소',
        intensity: selectedIntensity || undefined,

        sets: [{
          setNumber: 1,
          duration,
          distance: distance > 0 ? distance : undefined,
          speed: effectiveSpeed > 0 ? effectiveSpeed : undefined,
          incline: incline > 0 ? incline : undefined,
          jumpCount: parseFloat(cardioFields.jumpCount || '0') || undefined,
          stepCount: parseFloat(cardioFields.stepCount || '0') || undefined,
          floorCount: parseFloat(cardioFields.floorCount || '0') || undefined,
          reps: parseFloat(cardioFields.reps || '0') || undefined,
          pace,
          calories,
          completed: true,
        }],
      };

      if (editingContext) {
        await updateExerciseInSession(
          editingContext.date,
          editingContext.originalExerciseId,
          cardioPayload
        );
      } else {
        await upsertTodayExercise(cardioPayload);
      }


      Alert.alert(
        '✅ 기록 저장 완료',
        `${selectedExercise.name} ${duration}분\n🔥 약 ${calories} kcal`,
  [     { text: '확인', onPress: handlePostSaveSuccess}]    
      );
    } catch (e) {
      console.error('[WorkoutScreen] cardio 저장 실패:', e);
      Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
    }
    return;
  }



  // 완료된 세트만 (무게/횟수 입력 안 한 미완료 세트는 제외)
  const completedSets = sets.filter((s) => s.done);

  if (completedSets.length === 0) {
    Alert.alert(
      '저장할 세트가 없어요',
      '최소 1개 이상의 세트를 완료(✓)해주세요.',
      [{ text: '확인' }]
    );
    return;
  }

  try {
  const weightPayload = {
    exerciseId: selectedExercise.id,
    exerciseName: selectedExercise.name,
    category: selectedExercise.category,
    equipmentType: selectedExercise.equipmentType,
    bodyPart: selectedBodyPart || undefined,
    intensity: selectedIntensity || undefined,

    sets: completedSets.map((s, idx) => ({
      setNumber: idx + 1, // 자동 이어붙이기 (1, 2, 3, ...)
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps, 10) || 0,
      completed: true,
    })),
  };

  if (editingContext) {
    await updateExerciseInSession(
      editingContext.date,
      editingContext.originalExerciseId,
      weightPayload
    );
  } else {
    await upsertTodayExercise(weightPayload);
  }


    // 새로 추가된 세트 수 계산 (메시지용)
    const previouslySaved = completedSets.filter(
      (s) => s.originalSetNumber !== undefined
    ).length;
    const newlyAdded = completedSets.length - previouslySaved;

    const message =
      newlyAdded > 0
        ? `${selectedExercise.name} 총 ${completedSets.length}세트 (신규 ${newlyAdded}세트 추가)`
        : `${selectedExercise.name} ${completedSets.length}세트가 업데이트되었어요`;

  Alert.alert('✅ 기록 저장 완료', message, [
  {
    text: '확인',
    onPress: async () => {
      if (session) {
        // Active session: mark completed and advance
        await markCurrentCompleted();
        const next = await advanceExercise();
        if (!next) {
          // Last exercise done — end session
          Alert.alert(
            '🎉 운동 완료!',
            `오늘의 루틴을 모두 끝냈어요!\n수고하셨습니다 💪`,
            [{ text: '확인', onPress: async () => {
              await endSession();
              closeModal();
            }}]
          );
          return;
        }
        const nextEx = next.dayPlan.exercises[next.currentExerciseIndex];
        if (nextEx) {
          // Open next exercise in the modal
          sessionBus.emit({ type: 'openExercise', exerciseId: nextEx.exerciseId });
        } else {
          closeModal();
        }
      } else {
        // Not in a session — original behavior
        closeModal();
      }
    },
  },
]);

  } catch (error) {
    console.error('[WorkoutScreen] 저장 실패:', error);
    Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
  }
};

return (
<SafeAreaView style={styles.screen}>
<View style={styles.header}>
  <Text style={styles.headerTitle}>운동검색</Text>
  {streak > 0 && (
    <View style={{ backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#F97316' }}>
      <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '700' }}>🔥 {streak}일</Text>
    </View>
  )}
</View>


      {/* 카테고리 버튼 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll} 
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryBtn, 
              selectedCategory === cat.key && styles.categoryBtnActive
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={[
              styles.categoryText, 
              selectedCategory === cat.key && styles.categoryTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ExerciseFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        selectedEquipment={selectedEquipment}
        onEquipmentChange={setSelectedEquipment}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        availableEquipment={availableEquipment}
        resultCount={currentExercises.length}
/>

      {/* 운동 리스트 */}
      <ScrollView style={styles.exerciseList}>
                  {currentExercises.length === 0 ? (
            <View style={styles.emptyListBox}>
              <Text style={styles.emptyListEmoji}>🔍</Text>
              <Text style={styles.emptyListTitle}>검색 결과가 없어요</Text>
              <Text style={styles.emptyListSub}>다른 키워드나 필터를 시도해보세요</Text>
            </View>
          ) : (
          currentExercises.map((exercise: Exercise) => (
          <TouchableOpacity 
            key={exercise.id} 
            style={styles.exerciseCard}
            onPress={() => setSelectedExercise(exercise)}
          >
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseTarget}>{exercise.target}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{exercise.level}</Text>
              </View>
            </View>
            <Text style={styles.videoIcon}>🎥</Text>
          </TouchableOpacity>
        )))}
      </ScrollView>

      {/* 🚀 핵심 기능: YouTube + 운동 기록 통합 모달 */}
      <Modal
        visible={selectedExercise !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalScreen}>
            {session && <SessionHeaderBar />}
    
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <View>
              {editingContext && (
  <View style={styles.editBanner}>
    <Text style={styles.editBannerText}>
      ✏️ {editingContext.date} 기록 편집 중
    </Text>
  </View>
)}

              <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedExercise?.target} • {selectedExercise?.level}
              </Text>
              
              {/* 운동 부위 선택 영역 */}
<View style={styles.bodyPartSection}>
  <Text style={styles.bodyPartLabel}>운동 부위</Text>
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.bodyPartChipRow}
  >
    {BODY_PART_OPTIONS.map((part) => {
      const isSelected = selectedBodyPart === part;
      return (
        <TouchableOpacity
          key={part}
          style={[
            styles.bodyPartChip,
            isSelected && styles.bodyPartChipSelected,
          ]}
          onPress={() => 
            setSelectedBodyPart(isSelected ? null : part)
          }
          activeOpacity={0.7}
        >
          <Text style={[
            styles.bodyPartChipText,
            isSelected && styles.bodyPartChipTextSelected,
          ]}>
            {BODY_PART_EMOJI[part]} {part}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
</View>

{/* 운동 강도 선택 영역 */}
<View style={styles.bodyPartSection}>
  <Text style={styles.bodyPartLabel}>오늘 운동 강도</Text>
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.bodyPartChipRow}
  >
    {INTENSITY_OPTIONS.map((level) => {
      const isSelected = selectedIntensity === level;
      return (
        <TouchableOpacity
          key={level}
          style={[
            styles.bodyPartChip,
            isSelected && styles.bodyPartChipSelected,
          ]}
          onPress={() => 
            setSelectedIntensity(isSelected ? null : level)
          }
          activeOpacity={0.7}
        >
          <Text style={[
            styles.bodyPartChipText,
            isSelected && styles.bodyPartChipTextSelected,
          ]}>
            {INTENSITY_EMOJI[level]} {INTENSITY_LABEL[level]}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
</View>




            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

<ScrollView 
  style={styles.modalContent}
  contentContainerStyle={{ paddingBottom: 300 }}
  keyboardShouldPersistTaps="handled"
>
{/* Step C: 카디오 시간 선택 (cardio + duration 미선택 시) */}
{selectedExercise?.equipmentType === 'cardio' && !cardioDuration && (
  <View style={styles.videoContainer}>
    <Text style={styles.videoTitle}> 운동 영상 참고 시간 선택</Text>
    <Text style={styles.videoHelpText}>※ 칼로리 계산은 운동 시간 및 프로필 체중 기준입니다</Text>

    <View style={styles.durationRow}>
      {CARDIO_DURATIONS.map((d: CardioDuration) => (
        <TouchableOpacity
          key={d}
          style={styles.durationBtn}
          onPress={() => {
          setCardioDuration(d);
          // cardio 입력 폼의 시간 필드 자동 채움 (사용자가 이미 입력했으면 유지)
          setCardioFields(prev => ({
            ...prev,
            duration: prev.duration ?? String(d),
          }));
        }}

        >
          <Text style={styles.durationBtnText}>{d}분</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}
{/* Cardio 입력 폼 (cardio 운동일 때만 표시) */}
{selectedExercise?.equipmentType === 'cardio' && (
  <CardioInputForm
    exerciseName={selectedExercise.name}
    fields={cardioFields}
    onChange={setCardioFields}
    userWeightKg={userWeightKg}
  />
)}
{/* Step C: 영상 플레이어 + 영상 리스트 (시간 선택 완료 또는 비-cardio) */}
{(selectedExercise?.equipmentType !== 'cardio' || cardioDuration) && (
  <View style={styles.videoContainer}>
    <View style={styles.videoTitleRow}>
      <Text style={styles.videoTitle}>
        🎥 운동 가이드 영상
        {cardioDuration ? ` (${cardioDuration}분)` : ''}
      </Text>
      {videos.length > 0 && (
        <Text style={styles.videoCount}>{videos.length}개 영상</Text>
      )}
    </View>

    {/* 메인 플레이어 */}
    {currentVideoId ? (
      <View style={styles.playerContainer}>
{Platform.OS === 'web' ? (
  <iframe
    key={currentVideoId}
    width="100%"
    height="220"
   src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?rel=0&modestbranding=1&playsinline=1`}
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    style={{ borderRadius: 8 }}
  />
) : (
  <YoutubePlayer
    height={220}
    videoId={currentVideoId}
    play={false}
  />
)}

      </View>
    ) : (
      <View style={[styles.playerContainer, styles.playerPlaceholder]}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.placeholderText}>영상 검색 중...</Text>
          </>
        ) : (
          <Text style={styles.placeholderText}>
            {error ?? '영상을 준비 중입니다'}
          </Text>
        )}
      </View>
    )}

    {/* 영상 썸네일 가로 스크롤 */}
    {videos.length > 0 && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailScroll}
        contentContainerStyle={styles.thumbnailContainer}
      >
        {videos.map((video: ExerciseVideo) => {
          const isActive = video.videoId === currentVideoId;
          return (
            <TouchableOpacity
              key={video.videoId}
              style={[
                styles.thumbnailCard,
                isActive && styles.thumbnailCardActive,
              ]}
              onPress={() => setCurrentVideoId(video.videoId)}
            >
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={styles.thumbnailImage}
              />
              <Text style={styles.thumbnailTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={styles.thumbnailChannel} numberOfLines={1}>
                {video.channelTitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    )}

    {error && videos.length === 0 && (
      <Text style={styles.errorHint}>
        💡 인터넷 연결을 확인하거나 다른 운동을 선택해보세요
      </Text>
    )}
  </View>
)}

            {/* 운동 기록 섹션 (weight 운동만) */}
            {selectedExercise?.equipmentType !== 'cardio' && (
            <View style={styles.recordContainer}>
              <Text style={styles.recordTitle}>✍️ 세트 기록</Text>
              
              {/* 테이블 헤더 */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>세트</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>무게(kg)</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>횟수</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>완료</Text>
              </View>

            {/* 세트 입력 행들 */}
            {sets.map((set, index) => (
              <Swipeable
                key={set.id}
                renderRightActions={() => (
                  <TouchableOpacity
                    style={styles.swipeDeleteAction}
                    onPress={() => deleteSet(set.id)}
                  >
                    <Text style={styles.swipeDeleteText}>🗑 삭제</Text>
                  </TouchableOpacity>
                )}
                overshootRight={false}
              >
                <View style={[
                  styles.tableRow, 
                  set.done && styles.tableRowDone
                ]}>
                  <Text style={styles.setNumber}>{index + 1}</Text>
                  <TextInput 
                    style={[styles.input, set.done && styles.inputDone]} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    placeholderTextColor="#64748B"
                    value={set.weight}
                    onChangeText={(value) => updateSet(set.id, 'weight', value)}
                    editable={true}
                  />
                  <TextInput 
                    style={[styles.input, set.done && styles.inputDone]} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    placeholderTextColor="#64748B"
                    value={set.reps}
                    onChangeText={(value) => updateSet(set.id, 'reps', value)}
                    editable={true}
                  />
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.copyBtn}
                      onPress={() => copyFromPreviousSet(set.id)}
                    >
                      <Text style={styles.copyBtnText}>↑</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={[styles.checkBtn, set.done && styles.checkBtnDone]}
                    onPress={() => toggleSetDone(set.id)}
                  >
                    <Text style={styles.checkBtnText}>{set.done ? '✓' : ''}</Text>
                  </TouchableOpacity>
                </View>
              </Swipeable>
            ))}


              {/* 세트 추가 버튼 */}
              <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                <Text style={styles.addSetBtnText}>+ 세트 추가</Text>
              </TouchableOpacity>
            </View>
            )}

            {showRestTimer && (
            <RestTimer
              initialSec={getCurrentRestSec()}
              onComplete={() => setShowRestTimer(false)}
            />
          )}
            {/* 운동 완료 버튼 (cardio/weight 공통) */}
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={handleCompleteWorkout }
            >
              <Text style={styles.completeButtonText}>💾 운동 완료</Text>
            </TouchableOpacity>
          </ScrollView>

        </SafeAreaView>
      </Modal>



    </SafeAreaView>
  );
};

// 나머지 탭 화면들 (임시)
const VideoScreen = () => (
  <View style={[styles.screen, styles.centerContent]}>
    <Text style={styles.bigEmoji}>🎥</Text>
    <Text style={styles.screenTitle}>영상 가이드</Text>
    <Text style={styles.screenSub}>YouTube API 자동 검색 기능 추가 예정</Text>
  </View>
);

const CommunityScreen = () => (
  <View style={[styles.screen, styles.centerContent]}>
    <Text style={styles.bigEmoji}>👥</Text>
    <Text style={styles.screenTitle}>커뮤니티</Text>
    <Text style={styles.screenSub}>운동 인증 및 동기부여 기능 추가 예정</Text>
  </View>
);


export default function App() {
  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
       <ErrorBoundary>
        <SessionProvider>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#0F172A',
              borderTopColor: '#1E293B',
              paddingBottom: 8,
              height: 70,
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#64748B',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen name="Routine" component={RoutineScreen} options={{ title: '오늘의 운동' }} />
          <Tab.Screen name="Workout" component={WorkoutScreen} options={{ title: '운동 검색' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ title: '기록' }} />
          <Tab.Screen 
            name="MyPage"
            component={MyPageScreen}
            options={{ title: '마이페이지' }}
          />


        </Tab.Navigator>
      </NavigationContainer>
      </SessionProvider>
      </ErrorBoundary>
       </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
  color: '#F8FAFC',
  fontSize: 22,
  fontWeight: '700',},
  screen: { flex: 1, backgroundColor: '#0F172A' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
  paddingTop: 40,
  paddingHorizontal: 20,
  paddingBottom: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',},
  logo: { color: '#F8FAFC', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  headerSub: { color: '#64748B', fontSize: 14 },
  categoryScroll: { maxHeight: 60, marginBottom: 16 },
  categoryContainer: { paddingHorizontal: 20, gap: 8, flexDirection: 'row', alignItems: 'center' },
  categoryBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 25, 
    backgroundColor: '#1E293B', 
    borderWidth: 1, 
    borderColor: '#334155', 
    marginRight: 8 
  },
  categoryBtnActive: { backgroundColor: '#2563EB', borderColor: '#3B82F6' },
  categoryText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: '700' },
  exerciseList: { flex: 1, paddingHorizontal: 20 },
  exerciseCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E293B', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: '#F8FAFC', fontSize: 17, fontWeight: '600', marginBottom: 4 },
  exerciseTarget: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },
  levelBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#1E3A5F', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  levelText: { color: '#60A5FA', fontSize: 12, fontWeight: '600' },
  videoIcon: { fontSize: 28, marginLeft: 12 },
  bigEmoji: { fontSize: 64, marginBottom: 16 },
  screenTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  screenSub: { color: '#64748B', fontSize: 15, textAlign: 'center' },
  streakBadge: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  backgroundColor: '#1E293B',
  borderWidth: 1,
  borderColor: '#F59E0B',
},
streakBadgeText: {
  color: '#F59E0B',
  fontSize: 13,
  fontWeight: '700',
},
videoHelpText: {
  color: '#94A3B8',
  fontSize: 12,
  marginTop: 4,
  marginBottom: 8,
},
swipeDeleteAction: {
  backgroundColor: '#DC2626',
  justifyContent: 'center',
  alignItems: 'center',
  width: 80,
  marginVertical: 2,
  borderRadius: 8,
},
swipeDeleteText: {
  color: '#FFFFFF',
  fontWeight: '700',
  fontSize: 13,
},

copyBtn: {
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#1E293B',
  borderWidth: 1,
  borderColor: '#475569',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 4,
},
copyBtnText: {
  color: '#3B82F6',
  fontSize: 16,
  fontWeight: '700',
},

  
  // 모달 스타일
  modalScreen: { flex: 1, backgroundColor: '#0F172A' },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1E293B' 
  },
  modalTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700' },
  modalSubtitle: { color: '#94A3B8', fontSize: 14, marginTop: 2 },
  closeBtn: { 
    backgroundColor: '#1E293B', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  closeBtnText: { color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  modalContent: { flex: 1 },
  
  // 영상 섹션
  videoContainer: { padding: 20, paddingBottom: 0 },
  videoTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  playerContainer: { 
    backgroundColor: '#000', 
    borderRadius: 12, 
    overflow: 'hidden',
    marginBottom: 20 
  },
  
  // 기록 테이블
  recordContainer: { padding: 20 },
  recordTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  tableHeader: { 
    flexDirection: 'row', 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#334155', 
    marginBottom: 10 
  },
  tableHeaderText: { 
    color: '#94A3B8', 
    fontSize: 14, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E293B', 
    borderRadius: 12, 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    marginBottom: 8 
  },
  tableRowDone: { backgroundColor: '#064E3B', opacity: 0.8 },
  setNumber: { 
    flex: 1, 
    color: '#F8FAFC', 
    fontSize: 16, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  input: { 
    flex: 2, 
    backgroundColor: '#0F172A', 
    color: '#F8FAFC', 
    borderRadius: 8, 
    padding: 10, 
    marginHorizontal: 4, 
    textAlign: 'center', 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deleteSetBtn: {
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: '#1E293B',
  borderWidth: 1,
  borderColor: '#475569',
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 4,
},
deleteSetBtnText: {
  color: '#94A3B8',
  fontSize: 14,
  fontWeight: '600',
},

editBanner: {
  backgroundColor: '#F59E0B',
  paddingVertical: 8,
  paddingHorizontal: 16,
  alignItems: 'center',
},
editBannerText: {
  color: '#0F172A',
  fontWeight: '700',
  fontSize: 13,
},

emptyListBox: {
  paddingVertical: 60,
  alignItems: 'center',
},
emptyListEmoji: {
  fontSize: 48,
  marginBottom: 12,
},
emptyListTitle: {
  color: '#F8FAFC',
  fontSize: 16,
  fontWeight: '700',
  marginBottom: 6,
},
emptyListSub: {
  color: '#94A3B8',
  fontSize: 13,
},

  inputDone: { backgroundColor: '#065F46', borderColor: '#10B981' },
  checkBtn: { 
    flex: 1, 
    height: 36, 
    backgroundColor: '#334155', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 4 
  },
  checkBtnDone: { backgroundColor: '#10B981' },
  checkBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  addSetBtn: { 
    marginTop: 12, 
    backgroundColor: '#1E293B', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#334155', 
    borderStyle: 'dashed' 
  },
  addSetBtnText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  completeBtn: { 
    marginTop: 16, 
    backgroundColor: '#2563EB', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  completeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  completeButton: {
  backgroundColor: '#3B82F6',
  paddingVertical: 16,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 16,
  marginBottom: 8,
  shadowColor: '#3B82F6',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
},
completeButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '700',
  letterSpacing: 0.5,
},

// Step C: 영상 리스트 + 카디오 시간 선택 스타일
videoTitleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
videoCount: {
  color: '#3B82F6',
  fontSize: 13,
  fontWeight: '600',
},
playerPlaceholder: {
  height: 220,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#1E293B',
},
placeholderText: {
  color: '#94A3B8',
  fontSize: 14,
  marginTop: 12,
  textAlign: 'center',
},
thumbnailScroll: {
  marginTop: 16,
  marginBottom: 8,
},
thumbnailContainer: {
  paddingRight: 20,
  gap: 12,
},
thumbnailCard: {
  width: 160,
  backgroundColor: '#1E293B',
  borderRadius: 12,
  padding: 8,
  marginRight: 12,
  borderWidth: 2,
  borderColor: 'transparent',
},
thumbnailCardActive: {
  borderColor: '#3B82F6',
  backgroundColor: '#1E3A5F',
},
thumbnailImage: {
  width: '100%',
  height: 90,
  borderRadius: 8,
  backgroundColor: '#0F172A',
},
thumbnailTitle: {
  color: '#F8FAFC',
  fontSize: 12,
  fontWeight: '600',
  marginTop: 8,
  lineHeight: 16,
},
thumbnailChannel: {
  color: '#94A3B8',
  fontSize: 11,
  marginTop: 4,
},
errorHint: {
  color: '#94A3B8',
  fontSize: 13,
  textAlign: 'center',
  marginTop: 12,
  fontStyle: 'italic',
},
durationRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
},
durationBtn: {
  flex: 1,
  minWidth: '22%',
  backgroundColor: '#1E293B',
  paddingVertical: 18,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#334155',
  alignItems: 'center',
},
durationBtnText: {
  color: '#F8FAFC',
  fontSize: 16,
  fontWeight: '700',
},

bodyPartSection: {
  marginTop: 12,
  marginBottom: 8,
},
bodyPartLabel: {
  color: '#94A3B8',
  fontSize: 13,
  fontWeight: '600',
  marginBottom: 8,
  paddingHorizontal: 4,
},
bodyPartChipRow: {
  paddingHorizontal: 4,
  gap: 8,
},
bodyPartChip: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: '#1E293B',
  borderWidth: 1,
  borderColor: '#334155',
  marginRight: 8,
},
bodyPartChipSelected: {
  backgroundColor: '#3B82F6',
  borderColor: '#60A5FA',
},
bodyPartChipText: {
  color: '#94A3B8',
  fontSize: 13,
  fontWeight: '500',
},
bodyPartChipTextSelected: {
  color: '#FFFFFF',
  fontWeight: '700',
},

});

