import { useEffect, useState, useCallback } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { useUserStore, type UserStatus, type Emotion } from '../stores';

interface StatusData {
  status: string;
  emotion: string;
  customMessage: string;
  updatedAt: Date;
}

interface Couple {
  id: string;
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
}

interface UserProfile {
  id: string;
  name: string;
  characterType: 'male' | 'female';
}

interface UseCoupleStatusReturn {
  couple: Couple | null;
  isConnected: boolean;
  inviteCode: string | null;
  partner: UserProfile | null;
  partnerStatus: StatusData | null;
  myStatus: StatusData | null;
  loading: boolean;
  error: string | null;
  generateInviteCode: () => Promise<string>;
  joinWithCode: (code: string) => Promise<void>;
  updateStatus: (status: UserStatus, emotion: Emotion, message?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// 데모 모드용 상태
const DEMO_PARTNER_STATUS: StatusData = {
  status: 'studying',
  emotion: 'happy',
  customMessage: '열심히 공부 중! 💪',
  updatedAt: new Date(),
};

export function useCoupleStatus(): UseCoupleStatusReturn {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<StatusData | null>(null);
  const [myStatus, setMyStatus] = useState<StatusData | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    user,
    partner: storePartner,
    myStatus: storeMyStatus,
    myEmotion,
    myCustomMessage,
    setMyStatus: setMyStatusStore,
    setMyEmotion,
    setMyCustomMessage,
    setPartnerStatus: setPartnerStatusStore,
    setPartnerEmotion,
    setPartnerCustomMessage,
  } = useUserStore();

  // 초기화
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // 데모 모드
      setCouple({
        id: 'demo_couple_1',
        user1Id: 'demo_user_1',
        user2Id: 'demo_user_2',
        inviteCode: 'DEMO01',
      });
      setInviteCode('DEMO01');
      setPartner({
        id: 'demo_user_2',
        name: '파트너',
        characterType: 'female',
      });
      setPartnerStatus(DEMO_PARTNER_STATUS);
      setPartnerStatusStore(DEMO_PARTNER_STATUS.status as UserStatus);
      setPartnerEmotion(DEMO_PARTNER_STATUS.emotion as Emotion);
      setPartnerCustomMessage(DEMO_PARTNER_STATUS.customMessage);

      // 내 초기 상태
      setMyStatus({
        status: storeMyStatus || 'available',
        emotion: myEmotion || 'neutral',
        customMessage: myCustomMessage || '',
        updatedAt: new Date(),
      });

      setLoading(false);
      return;
    }

    // 실제 Firebase 모드는 여기서 처리
    setLoading(false);
  }, [setPartnerStatusStore, setPartnerEmotion, setPartnerCustomMessage, storeMyStatus, myEmotion, myCustomMessage]);

  // 내 상태 동기화
  useEffect(() => {
    setMyStatus({
      status: storeMyStatus,
      emotion: myEmotion,
      customMessage: myCustomMessage,
      updatedAt: new Date(),
    });
  }, [storeMyStatus, myEmotion, myCustomMessage]);

  // 파트너 정보 동기화
  useEffect(() => {
    if (storePartner) {
      setPartner(storePartner);
    }
  }, [storePartner]);

  const generateInviteCode = useCallback(async (): Promise<string> => {
    if (!isFirebaseConfigured) {
      const code = 'DEMO01';
      setInviteCode(code);
      return code;
    }

    const { createInviteCode } = await import('../services/couple');
    const code = await createInviteCode();
    setInviteCode(code);
    return code;
  }, []);

  const joinWithCode = useCallback(async (code: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      console.log('Demo mode: joined with code', code);
      return;
    }

    const { connectWithCode } = await import('../services/couple');
    await connectWithCode(code);
  }, []);

  const updateStatus = useCallback(
    async (status: UserStatus, emotion: Emotion, message: string = ''): Promise<void> => {
      // 로컬 상태 즉시 업데이트
      setMyStatusStore(status);
      setMyEmotion(emotion);
      setMyCustomMessage(message);

      setMyStatus({
        status,
        emotion,
        customMessage: message,
        updatedAt: new Date(),
      });

      if (!isFirebaseConfigured) {
        console.log('Demo mode: status updated', { status, emotion, message });
        return;
      }

      // Firebase에 저장
      try {
        const { updateMyStatus } = await import('../services/couple');
        await updateMyStatus(status, emotion, message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status');
        throw err;
      }
    },
    [setMyStatusStore, setMyEmotion, setMyCustomMessage]
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (!isFirebaseConfigured) {
      return;
    }
    // Firebase에서 데이터 다시 로드
  }, []);

  return {
    couple,
    isConnected: !!couple?.user2Id,
    inviteCode,
    partner,
    partnerStatus,
    myStatus,
    loading,
    error,
    generateInviteCode,
    joinWithCode,
    updateStatus,
    refresh,
  };
}
