import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView, TextInput 
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const Tab = createBottomTabNavigator();

// 🏋️ 운동기록 화면 (메인 기능)
const WorkoutScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('gym');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [sets, setSets] = useState([{ id: 1, weight: '', reps: '', done: false }]);

  const categories = [
    { key: 'gym', label: '🏋️ 헬스장' },
    { key: 'home', label: '🏠 홈트' },
    { key: 'yoga', label: '🧘 요가' },
    { key: 'cardio', label: '🏃 유산소' },
  ];

  // 실제 YouTube 운동 영상이 포함된 데이터
  const exercises: any = {
    gym: [
      { 
        id: '1', 
        name: '인클라인 덤벨 프레스', 
        target: '가슴, 어깨', 
        level: '중급', 
        videoId: 'jZOywn1qArI' // 실제 운동 영상
      },
      { 
        id: '2', 
        name: '벤치프레스', 
        target: '가슴', 
        level: '중급', 
        videoId: 'vthMCtgVtFw' 
      },
      { 
        id: '3', 
        name: '스쿼트', 
        target: '하체, 둔근', 
        level: '중급', 
        videoId: 'Fk9j6pQ6zjc' 
      },
      { 
        id: '4', 
        name: '데드리프트', 
        target: '등, 하체', 
        level: '고급', 
        videoId: 'op9kVnSso6Q' 
      },
    ],
    home: [
      { 
        id: '6', 
        name: '플랭크', 
        target: '코어', 
        level: '초급', 
        videoId: 'ASdvN_XEl_c' 
      },
      { 
        id: '7', 
        name: '버피', 
        target: '전신', 
        level: '중급', 
        videoId: 'TU8QYVW0gDU' 
      },
      { 
        id: '8', 
        name: '푸시업', 
        target: '가슴, 삼두', 
        level: '초급', 
        videoId: 'IODxDxX7oi4' 
      },
    ],
    yoga: [
      { 
        id: '9', 
        name: '태양경배', 
        target: '전신 스트레칭', 
        level: '초급', 
        videoId: '1wjZqLw8oI0' 
      },
      { 
        id: '10', 
        name: '다운독', 
        target: '어깨, 햄스트링', 
        level: '초급', 
        videoId: 'VpP7zW4wJo4' 
      },
    ],
    cardio: [
      { 
        id: '11', 
        name: 'HIIT 운동', 
        target: '심폐지구력', 
        level: '중급', 
        videoId: '9L2b2khySLE' 
      },
    ],
  };

  const currentExercises = exercises[selectedCategory] || [];

  // 세트 추가 함수
  const addSet = () => {
    setSets([...sets, { id: sets.length + 1, weight: '', reps: '', done: false }]);
  };

  // 세트 완료 토글 함수
  const toggleSetDone = (id: number) => {
    setSets(sets.map(set => set.id === id ? { ...set, done: !set.done } : set));
  };

  // 세트 데이터 업데이트 함수
  const updateSet = (id: number, field: 'weight' | 'reps', value: string) => {
    setSets(sets.map(set => set.id === id ? { ...set, [field]: value } : set));
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setSelectedExercise(null);
    setSets([{ id: 1, weight: '', reps: '', done: false }]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logo}>FitCoach 💪</Text>
        <Text style={styles.headerSub}>오늘의 운동을 선택하세요</Text>
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

      {/* 운동 리스트 */}
      <ScrollView style={styles.exerciseList}>
        {currentExercises.map((exercise: any) => (
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
        ))}
      </ScrollView>

      {/* 🚀 핵심 기능: YouTube + 운동 기록 통합 모달 */}
      <Modal
        visible={selectedExercise !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalScreen}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
              <Text style={styles.modalSubtitle}>
                {selectedExercise?.target} • {selectedExercise?.level}
              </Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* YouTube 영상 플레이어 */}
            <View style={styles.videoContainer}>
              <Text style={styles.videoTitle}>🎥 운동 가이드 영상</Text>
              {selectedExercise?.videoId && (
                <View style={styles.playerContainer}>
                  <YoutubePlayer
                    height={220}
                    play={false}
                    videoId={selectedExercise.videoId}
                  />
                </View>
              )}
            </View>

            {/* 운동 기록 섹션 */}
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
                <View key={set.id} style={[
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
                    editable={!set.done}
                  />
                  <TextInput 
                    style={[styles.input, set.done && styles.inputDone]} 
                    keyboardType="numeric" 
                    placeholder="0" 
                    placeholderTextColor="#64748B"
                    value={set.reps}
                    onChangeText={(value) => updateSet(set.id, 'reps', value)}
                    editable={!set.done}
                  />
                  <TouchableOpacity 
                    style={[styles.checkBtn, set.done && styles.checkBtnDone]}
                    onPress={() => toggleSetDone(set.id)}
                  >
                    <Text style={styles.checkBtnText}>{set.done ? '✓' : ''}</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* 세트 추가 버튼 */}
              <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
                <Text style={styles.addSetBtnText}>+ 세트 추가</Text>
              </TouchableOpacity>

              {/* 운동 완료 버튼 */}
              <TouchableOpacity style={styles.completeBtn} onPress={closeModal}>
                <Text style={styles.completeBtnText}>🏁 운동 완료</Text>
              </TouchableOpacity>
            </View>
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

const ProfileScreen = () => (
  <View style={[styles.screen, styles.centerContent]}>
    <Text style={styles.bigEmoji}>👤</Text>
    <Text style={styles.screenTitle}>마이페이지</Text>
    <Text style={styles.screenSub}>운동 통계 및 개인 기록 관리 예정</Text>
  </View>
);

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
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
          <Tab.Screen name="Workout" component={WorkoutScreen} options={{ title: '운동기록' }} />
          <Tab.Screen name="Videos" component={VideoScreen} options={{ title: '영상가이드' }} />
          <Tab.Screen name="Community" component={CommunityScreen} options={{ title: '커뮤니티' }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '마이페이지' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { paddingTop: 40, paddingHorizontal: 20, paddingBottom: 20 },
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
});
