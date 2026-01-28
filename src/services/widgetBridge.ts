import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserStatus, Emotion } from '../stores';

// iOS WidgetKit 브릿지 (react-native-widgetkit 사용 시)
let WidgetKit: any = null;
try {
  WidgetKit = require('react-native-widgetkit').default;
} catch {
  // 패키지가 없으면 무시
}

// 위젯에 전달할 파트너 상태 타입
export interface WidgetPartnerStatus {
  name: string;
  status: UserStatus;
  emotion: Emotion;
  customMessage: string;
  characterType: 'male' | 'female';
  updatedAt: number; // Unix timestamp
}

// App Group ID (iOS)
const IOS_APP_GROUP = 'group.com.yourapp.couplestatus';

// SharedPreferences 키 (Android)
const ANDROID_PREFS_KEY = 'partnerStatus';

/**
 * 위젯에 파트너 상태 데이터 전달
 */
export async function updateWidgetData(partnerStatus: WidgetPartnerStatus): Promise<void> {
  const data = JSON.stringify({
    ...partnerStatus,
    updatedAt: partnerStatus.updatedAt || Date.now(),
  });

  if (Platform.OS === 'ios') {
    await updateIOSWidget(data);
  } else if (Platform.OS === 'android') {
    await updateAndroidWidget(data);
  }
}

/**
 * iOS 위젯 업데이트
 */
async function updateIOSWidget(data: string): Promise<void> {
  try {
    // App Group의 UserDefaults에 저장
    // react-native-widgetkit 또는 네이티브 모듈 사용
    if (WidgetKit) {
      // react-native-widgetkit 사용
      await WidgetKit.setItem('partnerStatus', data, IOS_APP_GROUP);
      // 위젯 타임라인 새로고침
      WidgetKit.reloadAllTimelines();
    } else {
      // 네이티브 모듈 폴백
      const { SharedGroupPreferences } = NativeModules;
      if (SharedGroupPreferences) {
        await SharedGroupPreferences.setItem('partnerStatus', data, IOS_APP_GROUP);
      }
    }

    console.log('[Widget] iOS widget data updated');
  } catch (error) {
    console.warn('[Widget] Failed to update iOS widget:', error);
  }
}

/**
 * Android 위젯 업데이트
 */
async function updateAndroidWidget(data: string): Promise<void> {
  try {
    // SharedPreferences에 저장
    await AsyncStorage.setItem(`@widget:${ANDROID_PREFS_KEY}`, data);

    // 네이티브 위젯 갱신 브로드캐스트
    const { WidgetModule } = NativeModules;
    if (WidgetModule?.refreshWidget) {
      WidgetModule.refreshWidget();
    }

    console.log('[Widget] Android widget data updated');
  } catch (error) {
    console.warn('[Widget] Failed to update Android widget:', error);
  }
}

/**
 * 위젯 타임라인 강제 새로고침 (iOS)
 */
export function reloadWidgetTimelines(): void {
  if (Platform.OS === 'ios' && WidgetKit) {
    WidgetKit.reloadAllTimelines();
  }
}

/**
 * 특정 위젯만 새로고침 (iOS)
 */
export function reloadWidgetTimeline(kind: string): void {
  if (Platform.OS === 'ios' && WidgetKit) {
    WidgetKit.reloadTimelines(kind);
  }
}
