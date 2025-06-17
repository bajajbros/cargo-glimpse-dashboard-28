
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBA1Oj20-hf-NvyXo68nZozNBu1oV0r1_k',
  appId: '1:795655060434:web:dc11acb94c681c1809260b',
  messagingSenderId: '795655060434',
  projectId: 'himtech-379cb',
  authDomain: 'himtech-379cb.firebaseapp.com',
  storageBucket: 'himtech-379cb.firebasestorage.app',
  measurementId: 'G-ZM38P7TEPT',
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
