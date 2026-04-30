import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

// 임시 화면들 (나중에 별도 파일로 분리)
const WorkoutScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.emoji}>🏋️</Text>
    <Text style={styles.title}>FitCoach</Text>
    <Text style={styles.subtitle}>오늘의 운동을 기록해보세요</Text>
  </View>
);

const VideoScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.emoji}>🎥</Text>
    <Text style={styles.title}>영상 가이드</Text>
    <Text style={styles.subtitle}>YouTube 코칭 영상 연동 예정</Text>
  </View>
);

const CommunityScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.emoji}>👥</Text>
    <Text style={styles.title}>커뮤니티</Text>
    <Text style={styles.subtitle}>함께 운동하는 동기부여</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.emoji}>👤</Text>
    <Text style={styles.title}>마이페이지</Text>
    <Text style={styles.subtitle}>나의 운동 기록 통계</Text>
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
          <Tab.Screen
            name="Workout"
            component={WorkoutScreen}
            options={{ title: '운동기록' }}
          />
          <Tab.Screen
            name="Videos"
            component={VideoScreen}
            options={{ title: '영상가이드' }}
          />
          <Tab.Screen
            name="Community"
            component={CommunityScreen}
            options={{ title: '커뮤니티' }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: '마이페이지' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
});

