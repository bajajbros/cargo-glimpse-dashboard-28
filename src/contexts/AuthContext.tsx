
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
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          console.log('Fetching user document for:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'user_credentials', firebaseUser.uid));
          
          if (userDoc.exists()) {
            console.log('User document found:', userDoc.data());
            const userData = userDoc.data();
            
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: userData.role === 'admin' ? 'superadmin' : 'rms' as 'superadmin' | 'rms',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              shortName: userData.userId || '',
              permissions: userData.permissions || {},
              createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : userData.createdAt,
              createdBy: userData.createdBy
            };
            
            console.log('Setting user state:', newUser);
            setUser(newUser);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
          } else {
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: 'superadmin',
              firstName: '',
              lastName: '',
              shortName: '',
              permissions: {},
              createdAt: new Date(),
              createdBy: ''
            };
            setUser(basicUser);
            localStorage.setItem('currentUser', JSON.stringify(basicUser));
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user data');
          const basicUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: 'superadmin',
            firstName: '',
            lastName: '',
            shortName: '',
            permissions: {},
            createdAt: new Date(),
            createdBy: ''
          };
          setUser(basicUser);
          localStorage.setItem('currentUser', JSON.stringify(basicUser));
        }
      } else {
        console.log('No user, setting user to null');
        setUser(null);
        localStorage.removeItem('currentUser');
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

      const isAdmin = userId.includes('Superadmin');

      if (isAdmin) {
        const result = await signInWithEmailAndPassword(auth, userId, password);
        console.log('Admin login successful:', result.user.uid);
        
        const userDoc = await getDoc(doc(db, 'user_credentials', result.user.uid));
        if (!userDoc.exists()) {
          throw new Error('User data not found');
        }
      } else {
        console.log('RM login attempt with shortName:', userId.toLowerCase());
        
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
        
        if (rmData.password !== password) {
          throw new Error('Incorrect password');
        }

        if (rmData.status?.toLowerCase() !== 'active') {
          throw new Error('Account is not active');
        }

        await updateDoc(doc(db, 'relationship_managers', rmDoc.id), {
          lastLogin: serverTimestamp(),
        });
        
        await updateDoc(doc(db, 'user_credentials', rmDoc.id), {
          lastLogin: serverTimestamp(),
        });

        const newUser: User = {
          id: rmDoc.id,
          email: rmData.email || '',
          role: 'rms',
          firstName: rmData.firstName || '',
          lastName: rmData.lastName || '',
          shortName: rmData.shortName || '',
          permissions: rmData.permissions || {},
          createdAt: rmData.createdAt?.toDate ? rmData.createdAt.toDate() : rmData.createdAt,
          createdBy: rmData.createdBy
        };
        
        console.log('RM login successful, setting user:', newUser);
        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
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
      localStorage.removeItem('currentUser');
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
