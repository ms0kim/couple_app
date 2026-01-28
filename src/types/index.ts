// Firebase Document Types
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface CoupleDocument {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: FirestoreTimestamp;
  inviteCode?: string;
}

export interface UserDocument {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  characterType: 'male' | 'female';
  coupleId?: string;
  createdAt: FirestoreTimestamp;
}

export interface StatusDocument {
  userId: string;
  status: string;
  emotion: string;
  customMessage: string;
  updatedAt: FirestoreTimestamp;
}

// Character Asset Types
export interface CharacterAsset {
  id: string;
  name: string;
  type: 'male' | 'female';
  defaultImage: string;
  emotions: {
    [key: string]: string; // emotion -> image path
  };
}

// Navigation Types
export type RootStackParamList = {
  index: undefined;
  explore: undefined;
  modal: undefined;
};
