// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>앗, 문제가 발생했어요</Text>
          <Text style={styles.subtitle}>
            예상치 못한 오류로 화면을 표시할 수 없어요.{'\n'}
            아래 버튼으로 다시 시도해주세요.
          </Text>

          <TouchableOpacity style={styles.retryBtn} onPress={this.reset}>
            <Text style={styles.retryBtnText}>🔄 다시 시도</Text>
          </TouchableOpacity>

          {__DEV__ && this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorLabel}>개발자 정보:</Text>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
              {this.state.error.stack && (
                <Text style={styles.errorStack}>
                  {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: { fontSize: 72, marginBottom: 20 },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    width: '100%',
  },
  errorLabel: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
