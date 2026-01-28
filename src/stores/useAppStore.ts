import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // 앱 상태
  isLoading: boolean;
  isInitialized: boolean;

  // 테마
  themeMode: ThemeMode;

  // 알림
  notificationsEnabled: boolean;

  // Actions
  setIsLoading: (loading: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: true,
  isInitialized: false,
  themeMode: 'system',
  notificationsEnabled: true,

  setIsLoading: (isLoading) => set({ isLoading }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
  setThemeMode: (themeMode) => set({ themeMode }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
}));
