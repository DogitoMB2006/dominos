import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
}

interface UserData {
  uid: string;
  username: string;
  email: string;
  createdAt: Date;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      const usernameDoc = await getDoc(usernameRef);
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error('Username already taken');
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(user, { displayName: username });

      const newUserData: UserData = {
        uid: user.uid,
        username: username,
        email: email,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), newUserData);
      await setDoc(doc(db, 'usernames', username.toLowerCase()), { uid: user.uid });

      setUserData(newUserData);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    register,
    logout,
    loading,
    checkUsernameAvailable
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};