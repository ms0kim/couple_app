import '../global.css';

import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuthContext } from '@/src/providers';

function RootLayoutNav() {
  const { isAuthenticated, isConnected, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated) {
      // 로그인 안됨 -> 로그인 화면으로
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!isConnected) {
      // 로그인됨, 커플 연결 안됨 -> 연결 화면으로
      if (segments[1] !== 'connect') {
        router.replace('/(auth)/connect');
      }
    } else {
      // 로그인됨, 커플 연결됨 -> 메인 탭으로
      if (!inTabsGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isConnected, loading, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
