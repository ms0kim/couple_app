import { useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { updateWidgetData, reloadWidgetTimelines, type WidgetPartnerStatus } from '../services/widgetBridge';
import {
  registerBackgroundSync,
  setPartnerIdForSync,
  syncNow,
} from '../services/backgroundSync';
import { useCoupleStatus } from './useCoupleStatus';
import { isFirebaseConfigured, db } from '../services/firebase';
import type { UserStatus, Emotion } from '../stores';

/**
 * 위젯 동기화 훅
 * - 파트너 상태 변경 시 위젯 자동 업데이트
 * - 백그라운드 동기화 설정
 * - 앱 포그라운드 복귀 시 즉시 동기화
 */
export function useWidgetSync() {
  const { partner, partnerStatus, isConnected } = useCoupleStatus();
  const appState = useRef(AppState.currentState);
  const lastSyncRef = useRef<number>(0);

  // 위젯 데이터 업데이트
  const updateWidget = useCallback(async () => {
    if (!partner || !partnerStatus) return;

    const widgetData: WidgetPartnerStatus = {
      name: partner.name,
      status: partnerStatus.status as UserStatus,
      emotion: partnerStatus.emotion as Emotion,
      customMessage: partnerStatus.customMessage || '',
      characterType: partner.characterType,
      updatedAt: partnerStatus.updatedAt?.getTime() || Date.now(),
    };

    await updateWidgetData(widgetData);
    lastSyncRef.current = Date.now();

    console.log('[useWidgetSync] Widget updated');
  }, [partner, partnerStatus]);

  // 백그라운드 동기화 초기화
  useEffect(() => {
    if (!isConnected || !partner) return;

    const initBackgroundSync = async () => {
      // 파트너 ID 저장 (백그라운드 태스크에서 사용)
      await setPartnerIdForSync(partner.id);
      // 백그라운드 태스크 등록
      await registerBackgroundSync();

      console.log('[useWidgetSync] Background sync initialized');
    };

    initBackgroundSync();
  }, [isConnected, partner]);

  // 파트너 상태 변경 시 위젯 업데이트
  useEffect(() => {
    if (!partnerStatus) return;

    // 디바운스: 마지막 업데이트로부터 1초 이상 지났을 때만 업데이트
    const timeSinceLastSync = Date.now() - lastSyncRef.current;
    if (timeSinceLastSync < 1000) return;

    updateWidget();
  }, [partnerStatus, updateWidget]);

  // 앱 상태 변경 감지 (포그라운드 복귀 시 즉시 동기화)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 앱이 포그라운드로 돌아옴
        console.log('[useWidgetSync] App came to foreground, syncing...');
        syncNow();
        updateWidget();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [updateWidget]);

  // Firestore 실시간 리스너로 즉시 위젯 업데이트
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !partner) return;

    let unsubscribe: (() => void) | null = null;

    const setupRealtimeListener = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');

      unsubscribe = onSnapshot(
        doc(db, 'status', partner.id),
        (snapshot) => {
          if (!snapshot.exists()) return;

          const data = snapshot.data();
          const widgetData: WidgetPartnerStatus = {
            name: partner.name,
            status: data.status as UserStatus,
            emotion: data.emotion as Emotion,
            customMessage: data.customMessage || '',
            characterType: partner.characterType,
            updatedAt: data.updatedAt?.toMillis() || Date.now(),
          };

          // 위젯 즉시 업데이트
          updateWidgetData(widgetData);
          reloadWidgetTimelines();

          console.log('[useWidgetSync] Real-time update received, widget refreshed');
        },
        (error) => {
          console.error('[useWidgetSync] Real-time listener error:', error);
        }
      );
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [partner]);

  return {
    updateWidget,
    syncNow,
  };
}
