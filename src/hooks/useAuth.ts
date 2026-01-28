import { useEffect, useState } from 'react';
import { type User } from 'firebase/auth';
import {
  onAuthStateChange,
  getUserProfile,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  type UserProfile,
} from '../services/auth';
import { useUserStore } from '../stores';

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { setUser, reset: resetUserStore } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid);
          setProfile(userProfile);

          if (userProfile) {
            setUser({
              id: userProfile.id,
              name: userProfile.name,
              characterType: userProfile.characterType,
              profileImage: undefined,
            });
          }
        } catch (error) {
          console.error('Failed to get user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
        resetUserStore();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, resetUserStore]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userProfile = await authSignIn(email, password);
      setProfile(userProfile);
      setUser({
        id: userProfile.id,
        name: userProfile.name,
        characterType: userProfile.characterType,
      });
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    characterType: 'male' | 'female'
  ) => {
    setLoading(true);
    try {
      const userProfile = await authSignUp(email, password, name, characterType);
      setProfile(userProfile);
      setUser({
        id: userProfile.id,
        name: userProfile.name,
        characterType: userProfile.characterType,
      });
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authSignOut();
      setProfile(null);
      resetUserStore();
    } finally {
      setLoading(false);
    }
  };

  return {
    user: firebaseUser,
    profile,
    loading,
    isAuthenticated: !!firebaseUser,
    signIn,
    signUp,
    signOut,
  };
}
