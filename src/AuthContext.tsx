import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { testConnection, checkPendingProGrant, updateUserProfile } from './services/firestore';
import { onSnapshot, doc } from 'firebase/firestore';
import { UserProfile, ProfileType } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        setProfile(docSnapshot.data() as UserProfile);
      } else {
        // Initialize profile if it doesn't exist
        const pendingGrant = user.email ? await checkPendingProGrant(user.email) : null;
        
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          profileType: ProfileType.GENERIC,
          isPro: pendingGrant?.isPro || false,
          proExpirationDate: pendingGrant?.proExpirationDate || null
        };
        
        // Save to Firestore immediately
        try {
          await updateUserProfile(user.uid, newProfile);
          setProfile(newProfile);
        } catch (err) {
          console.error("Error creating user profile in Firestore:", err);
          // Still set locally so app works
          setProfile(newProfile);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching profile:', error);
      setLoading(false);
    });

    return unsubscribeProfile;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
