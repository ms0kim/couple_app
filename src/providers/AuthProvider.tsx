import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from 'firebase/auth';
import { isFirebaseConfigured, auth } from '../services/firebase';
import { useUserStore } from '../stores';

// 데모 모드용 더미 데이터
const DEMO_USER = {
  id: 'demo_user_1',
  email: 'demo@example.com',
  name: '데모 사용자',
  characterType: 'male' as const,
  coupleId: 'demo_couple_1',
};

const DEMO_PARTNER = {
  id: 'demo_user_2',
  email: 'partner@example.com',
  name: '파트너',
  characterType: 'female' as const,
  coupleId: 'demo_couple_1',
};

interface UserProfile {
  id: string;
  email: string;
  name: string;
  characterType: 'male' | 'female';
  coupleId?: string;
}

interface Couple {
  id: string;
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  couple: Couple | null;
  loading: boolean;
  isAuthenticated: boolean;
  isConnected: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  couple: null,
  loading: true,
  isAuthenticated: false,
  isConnected: false,
  isDemoMode: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  const { setUser: setUserStore, setPartner, setCoupleId, setIsConnected } = useUserStore();

  useEffect(() => {
    // 데모 모드: Firebase 설정 없이 실행
    if (!isFirebaseConfigured) {
      console.log('Running in demo mode');

      // 데모 유저 설정
      setProfile(DEMO_USER);
      setUserStore({
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        characterType: DEMO_USER.characterType,
      });

      // 데모 파트너 설정
      setPartner({
        id: DEMO_PARTNER.id,
        name: DEMO_PARTNER.name,
        characterType: DEMO_PARTNER.characterType,
      });

      // 데모 커플 설정
      setCouple({
        id: 'demo_couple_1',
        user1Id: DEMO_USER.id,
        user2Id: DEMO_PARTNER.id,
        inviteCode: 'DEMO01',
      });
      setCoupleId('demo_couple_1');
      setIsConnected(true);

      setLoading(false);
      return;
    }

    // 실제 Firebase 인증
    if (!auth) {
      setLoading(false);
      return;
    }

    const { onAuthStateChanged } = require('firebase/auth');
    const { getUserProfile } = require('../services/auth');
    const { getMyCouple } = require('../services/couple');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);

          if (userProfile) {
            setUserStore({
              id: userProfile.id,
              name: userProfile.name,
              characterType: userProfile.characterType,
            });

            const coupleData = await getMyCouple();
            setCouple(coupleData);

            if (coupleData) {
              setCoupleId(coupleData.id);
              setIsConnected(!!coupleData.user2Id);
            }
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      } else {
        setProfile(null);
        setCouple(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUserStore, setPartner, setCoupleId, setIsConnected]);

  const isDemoMode = !isFirebaseConfigured;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        couple,
        loading,
        isAuthenticated: isDemoMode ? true : !!user,
        isConnected: isDemoMode ? true : !!couple?.user2Id,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
