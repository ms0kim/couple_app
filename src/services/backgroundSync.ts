import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateWidgetData, type WidgetPartnerStatus } from './widgetBridge';
import { isFirebaseConfigured, db } from './firebase';

// 백그라운드 태스크 이름
const BACKGROUND_SYNC_TASK = 'COUPLE_STATUS_BACKGROUND_SYNC';
const STORAGE_KEY_PARTNER_ID = '@couple:partnerId';
const STORAGE_KEY_LAST_SYNC = '@couple:lastSync';

/**
 * 백그라운드 태스크 정의
 * - 15분마다 실행되어 파트너 상태를 가져와 위젯 업데이트
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[BackgroundSync] Task started');

    // 파트너 ID 가져오기
    const partnerId = await AsyncStorage.getItem(STORAGE_KEY_PARTNER_ID);
    if (!partnerId) {
      console.log('[BackgroundSync] No partner ID found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Firebase에서 파트너 상태 가져오기
    if (!isFirebaseConfigured || !db) {
      console.log('[BackgroundSync] Firebase not configured');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const { doc, getDoc } = await import('firebase/firestore');

    // 파트너 프로필 가져오기
    const userDoc = await getDoc(doc(db, 'users', partnerId));
    const statusDoc = await getDoc(doc(db, 'status', partnerId));

    if (!userDoc.exists() || !statusDoc.exists()) {
      console.log('[BackgroundSync] Partner data not found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const userData = userDoc.data();
    const statusData = statusDoc.data();

    // 위젯 데이터 업데이트
    const widgetData: WidgetPartnerStatus = {
      name: userData.name,
      status: statusData.status,
      emotion: statusData.emotion,
      customMessage: statusData.customMessage || '',
      characterType: userData.characterType,
      updatedAt: statusData.updatedAt?.toMillis() || Date.now(),
    };

    await updateWidgetData(widgetData);

    // 마지막 동기화 시간 저장
    await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());

    console.log('[BackgroundSync] Task completed successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundSync] Task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * 백그라운드 동기화 등록
 */
export async function registerBackgroundSync(): Promise<void> {
  try {
    // 기존 태스크 해제
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    }

    // 새 태스크 등록
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15분 (초 단위)
      stopOnTerminate: false, // 앱 종료 후에도 계속 실행
      startOnBoot: true, // 기기 재시작 시 자동 시작
    });

    console.log('[BackgroundSync] Task registered');
  } catch (error) {
    console.error('[BackgroundSync] Failed to register task:', error);
  }
}

/**
 * 백그라운드 동기화 해제
 */
export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[BackgroundSync] Task unregistered');
    }
  } catch (error) {
    console.error('[BackgroundSync] Failed to unregister task:', error);
  }
}

/**
 * 백그라운드 동기화 상태 확인
 */
export async function getBackgroundSyncStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
  return await BackgroundFetch.getStatusAsync();
}

/**
 * 파트너 ID 저장 (백그라운드 태스크에서 사용)
 */
export async function setPartnerIdForSync(partnerId: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_PARTNER_ID, partnerId);
}

/**
 * 마지막 동기화 시간 가져오기
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const timestamp = await AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
  return timestamp ? new Date(parseInt(timestamp, 10)) : null;
}

/**
 * 즉시 동기화 실행 (포그라운드에서)
 */
export async function syncNow(): Promise<void> {
  try {
    const partnerId = await AsyncStorage.getItem(STORAGE_KEY_PARTNER_ID);
    if (!partnerId || !isFirebaseConfigured || !db) return;

    const { doc, getDoc } = await import('firebase/firestore');

    const userDoc = await getDoc(doc(db, 'users', partnerId));
    const statusDoc = await getDoc(doc(db, 'status', partnerId));

    if (!userDoc.exists() || !statusDoc.exists()) return;

    const userData = userDoc.data();
    const statusData = statusDoc.data();

    const widgetData: WidgetPartnerStatus = {
      name: userData.name,
      status: statusData.status,
      emotion: statusData.emotion,
      customMessage: statusData.customMessage || '',
      characterType: userData.characterType,
      updatedAt: statusData.updatedAt?.toMillis() || Date.now(),
    };

    await updateWidgetData(widgetData);
    await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, Date.now().toString());

    console.log('[BackgroundSync] Manual sync completed');
  } catch (error) {
    console.error('[BackgroundSync] Manual sync failed:', error);
  }
}
