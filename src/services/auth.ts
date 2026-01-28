import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { COLLECTIONS } from '../constants';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  characterType: 'male' | 'female';
  coupleId?: string;
  createdAt: Date;
}

// 회원가입
export async function signUp(
  email: string,
  password: string,
  name: string,
  characterType: 'male' | 'female'
): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase is not configured');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userProfile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    id: user.uid,
    email: user.email!,
    name,
    characterType,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userProfile);

  return {
    ...userProfile,
    createdAt: new Date(),
  };
}

// 로그인
export async function signIn(email: string, password: string): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase is not configured');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(userCredential.user.uid);

  if (!profile) {
    throw new Error('User profile not found');
  }

  return profile;
}

// 로그아웃
export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured || !auth) {
    return;
  }
  await firebaseSignOut(auth);
}

// 유저 프로필 조회
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) {
    return null;
  }
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    email: data.email,
    name: data.name,
    characterType: data.characterType,
    coupleId: data.coupleId,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

// 인증 상태 리스너
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    // Firebase 미설정 시 즉시 null 반환하고 빈 unsubscribe 반환
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// 현재 유저 가져오기
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }
  return auth.currentUser;
}
