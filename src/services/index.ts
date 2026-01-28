export { auth, db } from './firebase';

export {
  signUp,
  signIn,
  signOut,
  getUserProfile,
  onAuthStateChange,
  getCurrentUser,
  type UserProfile,
} from './auth';

export {
  createInviteCode,
  connectWithCode,
  getMyCouple,
  getPartnerId,
  updateMyStatus,
  subscribeToStatus,
  subscribeToCoupleConnection,
  type Couple,
  type StatusData,
} from './couple';
