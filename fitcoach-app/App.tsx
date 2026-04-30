import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const Tab = createBottomTabNavigator();

// 🏋️ 운동기록 화면 (Planfit 스타일)
const WorkoutScreen = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('gym');

  const categories = [
    { key: 'gym', label: '🏋️ 헬스장' },
    { key: 'home', label: '🏠 홈트' },
    { key: 'yoga', label: '🧘 요가' },
    { key: 'cardio', label: '🏃 유산소' },
  ];

  const exercises = {
    gym: [
      { id: '1', name: '인클라인 덤벨 프레스', target: '가슴, 어깨', level: '중급' },
      { id: '2', name: '벤치프레스', target: '가슴', level: '중급' },
      { id: '3', name: '스쿼트', target: '하체, 둔근', level: '중급' },
      { id: '4', name: '데드리프트', target: '등, 하체', level: '고급' },
      { id: '5', name: '랫풀다운', target: '등, 이두', level: '초급' },
    ],
    home: [
      { id: '6', name: '플랭크', target: '코어', level: '초급' },
      { id: '7', name: '버피', target: '전신', level: '중급' },
      { id: '8', name: '푸시업', target: '가슴, 삼두', level: '초급' },
    ],
    yoga: [
      { id: '9', name: '태양경배', target: '전신 스트레칭', level: '초급' },
      { id: '10', name: '다운독', target: '어깨, 햄스트링', level: '초급' },
    ],
    cardio: [
      { id: '11', name: '런닝', target: '심폐지구력', level: '중급' },
      { id: '12', name: '사이클', target: '하체, 심폐', level: '초급' },
    ],
  };

  const currentExercises = exercises[selectedCategory] || [];

  return (
    <View style={styles.screen}>
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
              selectedCategory === cat.key && styles.categoryBtnActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.key && styles.categoryTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 운동 리스트 */}
      <ScrollView style={styles.exerciseList}>
        {currentExercises.map((exercise) => (
          <TouchableOpacity key={exercise.id} style={styles.exerciseCard}>
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
    </View>
  );
};

// 🎥 영상가이드 화면
const VideoScreen = () => (
  <View style={[styles.screen, styles.centerContent]}>
    <Text style={styles.bigEmoji}>🎥</Text>
    <Text style={styles.screenTitle}>영상 가이드</Text>
    <Text style={styles.screenSub}>YouTube 코칭 영상 연동 예정</Text>
  </View>
);

// 👥 커뮤니티 화면
const CommunityScreen = () => (
  <View style={[styles.screen, styles.centerContent]}>
    <Text style={styles.bigEmoji}>👥</Text>
    <Text style={styles.screenTitle}>커뮤니티</Text>
    <Text style={styles.screenSub}>함께 운동하는 동기부여</Text>
  </View>
);

// 👤 마이페이지 화면
const ProfileScreen = () => (
  <View style={[styles.screen, styles.centerContent]}>
    <Text style={styles.bigEmoji}>👤</Text>
    <Text style={styles.screenTitle}>마이페이지</Text>
    <Text style={styles.screenSub}>나의 운동 기록 통계</Text>
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
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logo: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 14,
  },
  categoryScroll: {
    maxHeight: 60,
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  categoryBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  categoryText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseTarget: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  videoIcon: {
    fontSize: 28,
    marginLeft: 12,
  },
  bigEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  screenTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  screenSub: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
  },
});
