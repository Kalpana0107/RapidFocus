import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  handleFirestoreError,
  OperationType
} from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: () => Promise<void>;
  signOutUser: () => Promise<void>;
  saveProfile: (name: string, role: UserRole) => Promise<void>;
  setProfileState: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const isLocalDemo = localStorage.getItem("rapidfocus_is_demo") === "true";
    
    // Set initial state from localStorage if it's demo
    if (isLocalDemo) {
      const mockUser = {
        uid: "demo-sandbox-uid",
        email: "sandbox-user@rapidfocus.io",
        displayName: "Demo User",
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: []
      } as any;
      setUser(mockUser);
      const localProfile = localStorage.getItem("rapidfocus_demo_profile") 
        ? JSON.parse(localStorage.getItem("rapidfocus_demo_profile")!) 
        : {
            uid: "demo-sandbox-uid",
            name: "Demo User",
            email: "sandbox-user@rapidfocus.io",
            role: "Professional",
            createdAt: new Date().toISOString()
          };
      setProfile(localProfile);
      setIsDemoMode(true);
      setLoading(false);
    }

    // Always subscribe to auth state changes to keep user synchronized
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsDemoMode(false);
        localStorage.removeItem("rapidfocus_is_demo");
        
        // Fetch profile
        const path = `users/${firebaseUser.uid}`;
        try {
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        // If not authenticated and not in local demo mode, set to null
        if (!localStorage.getItem("rapidfocus_is_demo")) {
          setUser(null);
          setProfile(null);
          setIsDemoMode(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      setUser(firebaseUser);
      setIsDemoMode(false);
      localStorage.removeItem("rapidfocus_is_demo");
      
      // Attempt to load existing profile
      const path = `users/${firebaseUser.uid}`;
      try {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      throw error;
    }
  };

  const signInWithDemo = async () => {
    const demoEmail = "sandbox-user@rapidfocus.io";
    const demoPassword = "DemoPassword123!";
    
    const useLocalFallback = () => {
      console.warn("Using pure local sandbox mode directly.");
      const mockUser = {
        uid: "demo-sandbox-uid",
        email: "sandbox-user@rapidfocus.io",
        displayName: "Demo User",
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: []
      } as any;
      
      setUser(mockUser);
      const localProfile: UserProfile = {
        uid: "demo-sandbox-uid",
        name: "Demo User",
        email: "sandbox-user@rapidfocus.io",
        role: "Professional",
        createdAt: new Date().toISOString()
      };
      setProfile(localProfile);
      setIsDemoMode(true);
      localStorage.setItem("rapidfocus_is_demo", "true");
      localStorage.setItem("rapidfocus_demo_profile", JSON.stringify(localProfile));
    };

    try {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (loginErr: any) {
        if (loginErr.code === "auth/user-not-found" || loginErr.code === "auth/invalid-credential") {
          credential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        } else {
          throw loginErr;
        }
      }

      const firebaseUser = credential.user;
      setUser(firebaseUser);
      const path = `users/${firebaseUser.uid}`;
      let profileDoc;
      try {
        profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }

      if (profileDoc && profileDoc.exists()) {
        setProfile(profileDoc.data() as UserProfile);
      } else {
        // Create pre-filled sandbox profile if totally new
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: "Demo User",
          email: firebaseUser.email || demoEmail,
          role: "Professional",
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
        setProfile(newProfile);
      }
      setIsDemoMode(false);
      localStorage.removeItem("rapidfocus_is_demo");
    } catch (error: any) {
      console.warn("Firebase Auth demo login failed/disabled, activating local-only demo mode:", error);
      useLocalFallback();
    }
  };

  const signOutUser = async () => {
    localStorage.removeItem("rapidfocus_is_demo");
    localStorage.removeItem("rapidfocus_demo_profile");
    localStorage.removeItem("rapidfocus_demo_tasks");
    localStorage.removeItem("rapidfocus_demo_goals");
    setIsDemoMode(false);
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const saveProfile = async (name: string, role: UserRole) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      name,
      email: user.email || "",
      role,
      createdAt: new Date().toISOString()
    };
    if (isDemoMode) {
      localStorage.setItem("rapidfocus_demo_profile", JSON.stringify(newProfile));
      setProfile(newProfile);
    } else {
      const path = `users/${user.uid}`;
      try {
        await setDoc(doc(db, "users", user.uid), newProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      setProfile(newProfile);
    }
  };

  const setProfileState = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isDemoMode,
      signInWithGoogle, 
      signInWithDemo,
      signOutUser, 
      saveProfile,
      setProfileState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
