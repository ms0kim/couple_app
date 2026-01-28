import { create } from 'zustand';

export type UserStatus =
  | 'available'
  | 'busy'
  | 'studying'
  | 'working'
  | 'sleeping'
  | 'eating'
  | 'exercising'
  | 'custom';

export type Emotion =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'tired'
  | 'excited'
  | 'neutral'
  | 'love';

interface User {
  id: string;
  name: string;
  profileImage?: string;
  characterType: 'male' | 'female';
}

interface UserState {
  // 현재 유저 정보
  user: User | null;
  partner: User | null;

  // 상태 정보
  myStatus: UserStatus;
  myEmotion: Emotion;
  myCustomMessage: string;

  // 파트너 상태 (실시간 동기화용)
  partnerStatus: UserStatus;
  partnerEmotion: Emotion;
  partnerCustomMessage: string;

  // 커플 연결 정보
  coupleId: string | null;
  isConnected: boolean;

  // Actions
  setUser: (user: User) => void;
  setPartner: (partner: User) => void;
  setMyStatus: (status: UserStatus) => void;
  setMyEmotion: (emotion: Emotion) => void;
  setMyCustomMessage: (message: string) => void;
  setPartnerStatus: (status: UserStatus) => void;
  setPartnerEmotion: (emotion: Emotion) => void;
  setPartnerCustomMessage: (message: string) => void;
  setCoupleId: (id: string) => void;
  setIsConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  partner: null,
  myStatus: 'available' as UserStatus,
  myEmotion: 'neutral' as Emotion,
  myCustomMessage: '',
  partnerStatus: 'available' as UserStatus,
  partnerEmotion: 'neutral' as Emotion,
  partnerCustomMessage: '',
  coupleId: null,
  isConnected: false,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner }),
  setMyStatus: (myStatus) => set({ myStatus }),
  setMyEmotion: (myEmotion) => set({ myEmotion }),
  setMyCustomMessage: (myCustomMessage) => set({ myCustomMessage }),
  setPartnerStatus: (partnerStatus) => set({ partnerStatus }),
  setPartnerEmotion: (partnerEmotion) => set({ partnerEmotion }),
  setPartnerCustomMessage: (partnerCustomMessage) => set({ partnerCustomMessage }),
  setCoupleId: (coupleId) => set({ coupleId }),
  setIsConnected: (isConnected) => set({ isConnected }),
  reset: () => set(initialState),
}));
