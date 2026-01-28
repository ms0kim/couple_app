import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  collection,
  serverTimestamp,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../constants';
import { getCurrentUser } from './auth';

export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
  createdAt: Date;
  connectedAt?: Date;
}

export interface StatusData {
  status: string;
  emotion: string;
  customMessage: string;
  updatedAt: Date;
}

// 6자리 초대 코드 생성
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외 (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 초대 코드 생성 (커플 문서 생성)
export async function createInviteCode(): Promise<string> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // 기존 커플이 있는지 확인
  const existingCouple = await getMyCouple();
  if (existingCouple) {
    // 이미 연결된 커플이 있으면 에러
    if (existingCouple.user2Id) {
      throw new Error('Already connected with partner');
    }
    // 연결 대기 중이면 기존 코드 반환
    return existingCouple.inviteCode;
  }

  // 새 초대 코드 생성
  const inviteCode = generateInviteCode();
  const coupleId = `couple_${user.uid}_${Date.now()}`;

  await setDoc(doc(db, COLLECTIONS.COUPLES, coupleId), {
    user1Id: user.uid,
    user2Id: null,
    inviteCode,
    createdAt: serverTimestamp(),
  });

  // 유저 문서에 coupleId 저장
  await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    coupleId,
  });

  // 초기 상태 문서 생성
  await setDoc(doc(db, COLLECTIONS.STATUS, user.uid), {
    userId: user.uid,
    status: 'available',
    emotion: 'neutral',
    customMessage: '',
    updatedAt: serverTimestamp(),
  });

  return inviteCode;
}

// 초대 코드로 커플 연결
export async function connectWithCode(inviteCode: string): Promise<Couple> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // 이미 커플이 있는지 확인
  const existingCouple = await getMyCouple();
  if (existingCouple?.user2Id) {
    throw new Error('Already connected with partner');
  }

  // 초대 코드로 커플 찾기
  const couplesRef = collection(db, COLLECTIONS.COUPLES);
  const q = query(couplesRef, where('inviteCode', '==', inviteCode.toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Invalid invite code');
  }

  const coupleDoc = querySnapshot.docs[0];
  const coupleData = coupleDoc.data();

  // 자기 자신의 코드인지 확인
  if (coupleData.user1Id === user.uid) {
    throw new Error('Cannot connect with your own code');
  }

  // 이미 연결된 커플인지 확인
  if (coupleData.user2Id) {
    throw new Error('This code is already used');
  }

  // 커플 연결
  await updateDoc(doc(db, COLLECTIONS.COUPLES, coupleDoc.id), {
    user2Id: user.uid,
    connectedAt: serverTimestamp(),
  });

  // 유저 문서에 coupleId 저장
  await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    coupleId: coupleDoc.id,
  });

  // 기존 대기 중인 커플 문서가 있으면 삭제
  if (existingCouple && !existingCouple.user2Id) {
    await deleteDoc(doc(db, COLLECTIONS.COUPLES, existingCouple.id));
  }

  // 초기 상태 문서 생성
  await setDoc(doc(db, COLLECTIONS.STATUS, user.uid), {
    userId: user.uid,
    status: 'available',
    emotion: 'neutral',
    customMessage: '',
    updatedAt: serverTimestamp(),
  });

  return {
    id: coupleDoc.id,
    user1Id: coupleData.user1Id,
    user2Id: user.uid,
    inviteCode: coupleData.inviteCode,
    createdAt: coupleData.createdAt?.toDate() ?? new Date(),
    connectedAt: new Date(),
  };
}

// 내 커플 정보 가져오기
export async function getMyCouple(): Promise<Couple | null> {
  const user = getCurrentUser();
  if (!user) return null;

  // 유저 문서에서 coupleId 확인
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
  if (!userDoc.exists()) return null;

  const coupleId = userDoc.data().coupleId;
  if (!coupleId) return null;

  const coupleDoc = await getDoc(doc(db, COLLECTIONS.COUPLES, coupleId));
  if (!coupleDoc.exists()) return null;

  const data = coupleDoc.data();
  return {
    id: coupleDoc.id,
    user1Id: data.user1Id,
    user2Id: data.user2Id,
    inviteCode: data.inviteCode,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    connectedAt: data.connectedAt?.toDate(),
  };
}

// 파트너 ID 가져오기
export function getPartnerId(couple: Couple, myUserId: string): string | null {
  if (couple.user1Id === myUserId) return couple.user2Id;
  if (couple.user2Id === myUserId) return couple.user1Id;
  return null;
}

// 상태 업데이트
export async function updateMyStatus(
  status: string,
  emotion: string,
  customMessage: string
): Promise<void> {
  const user = getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  await setDoc(
    doc(db, COLLECTIONS.STATUS, user.uid),
    {
      userId: user.uid,
      status,
      emotion,
      customMessage,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// 상태 실시간 구독
export function subscribeToStatus(
  userId: string,
  callback: (status: StatusData | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.STATUS, userId),
    (doc) => {
      if (!doc.exists()) {
        callback(null);
        return;
      }

      const data = doc.data();
      callback({
        status: data.status,
        emotion: data.emotion,
        customMessage: data.customMessage,
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
      });
    },
    (error) => {
      console.error('Status subscription error:', error);
      callback(null);
    }
  );
}

// 커플 연결 상태 실시간 구독
export function subscribeToCoupleConnection(
  coupleId: string,
  callback: (couple: Couple | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.COUPLES, coupleId),
    (doc) => {
      if (!doc.exists()) {
        callback(null);
        return;
      }

      const data = doc.data();
      callback({
        id: doc.id,
        user1Id: data.user1Id,
        user2Id: data.user2Id,
        inviteCode: data.inviteCode,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        connectedAt: data.connectedAt?.toDate(),
      });
    },
    (error) => {
      console.error('Couple subscription error:', error);
      callback(null);
    }
  );
}
