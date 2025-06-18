
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (userId: string, password: string) => Promise<void>;
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
          const userDoc = await getDoc(doc(db, 'user_credentials', firebaseUser.uid));
          
          if (userDoc.exists()) {
            console.log('User document found:', userDoc.data());
            const userData = userDoc.data();
            
            const newUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userData.role === 'admin' ? 'superadmin' : 'rms',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              shortName: userData.userId || '',
              permissions: userData.permissions || {},
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
              createdBy: userData.createdBy
            };
            
            console.log('Setting user state:', newUser);
            setUser(newUser);
          } else {
            throw new Error('User data not found');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user data');
          await signOut(auth);
        }
      } else {
        console.log('No user, setting user to null');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (userId: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Attempting login for:', userId);

      // Check if input contains 'Superadmin' (admin login)
      const isAdmin = userId.includes('Superadmin');

      if (isAdmin) {
        // Admin login with email
        const result = await signInWithEmailAndPassword(auth, userId, password);
        console.log('Admin login successful:', result.user.uid);
        
        const userDoc = await getDoc(doc(db, 'user_credentials', result.user.uid));
        if (!userDoc.exists()) {
          throw new Error('User data not found');
        }
      } else {
        // RM login with shortName
        console.log('RM login attempt with shortName:', userId.toLowerCase());
        
        // First check in relationship_managers collection
        const rmQuery = query(
          collection(db, 'relationship_managers'),
          where('shortName', '==', userId.toLowerCase())
        );
        const rmSnapshot = await getDocs(rmQuery);

        if (rmSnapshot.empty) {
          throw new Error('Invalid User ID');
        }

        const rmDoc = rmSnapshot.docs[0];
        const rmData = rmDoc.data();
        
        // Verify password
        if (rmData.password !== password) {
          throw new Error('Incorrect password');
        }

        // Check if RM is active
        if (rmData.status?.toLowerCase() !== 'active') {
          throw new Error('Account is not active');
        }

        // Update last login
        await updateDoc(doc(db, 'relationship_managers', rmDoc.id), {
          lastLogin: serverTimestamp(),
        });
        
        await updateDoc(doc(db, 'user_credentials', rmDoc.id), {
          lastLogin: serverTimestamp(),
        });

        // For RM login, we need to manually set the user since Firebase Auth wasn't used
        const newUser = {
          id: rmDoc.id,
          email: rmData.email || '',
          role: 'rms' as const,
          firstName: rmData.firstName || '',
          lastName: rmData.lastName || '',
          shortName: rmData.shortName || '',
          permissions: rmData.permissions || {},
          createdAt: rmData.createdAt?.toDate ? rmData.createdAt.toDate() : rmData.createdAt,
          createdBy: rmData.createdBy
        };
        
        console.log('RM login successful, setting user:', newUser);
        setUser(newUser);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
      throw err;
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
