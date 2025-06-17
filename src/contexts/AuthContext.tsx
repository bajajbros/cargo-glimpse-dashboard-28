
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          console.log('Fetching user document for:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          let userData;
          if (userDoc.exists()) {
            console.log('User document found:', userDoc.data());
            userData = userDoc.data();
          } else {
            console.log('User document not found, creating default user data');
            // If user document doesn't exist, create a default user
            userData = {
              role: 'rms', // default role
              createdAt: new Date(),
              createdBy: 'system'
            };
          }
          
          const newUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: userData.role,
            createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
            createdBy: userData.createdBy
          };
          
          console.log('Setting user state:', newUser);
          setUser(newUser);
        } catch (err) {
          console.error('Error fetching user data:', err);
          // Even if there's an error, set a basic user object so login can proceed
          const basicUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: 'rms' as const,
            createdAt: new Date(),
            createdBy: 'system'
          };
          console.log('Setting basic user due to error:', basicUser);
          setUser(basicUser);
          setError('Failed to load complete user data, using basic profile');
        }
      } else {
        console.log('No user, setting user to null');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Attempting login for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.uid);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
