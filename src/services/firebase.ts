import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Extracted from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyA3qoUsvos6lRmk4rbz8axxVQnY4UECBCI",
  authDomain: "arogyabot2.firebaseapp.com",
  projectId: "arogyabot2",
  storageBucket: "arogyabot2.firebasestorage.app",
  messagingSenderId: "564585755298",
  appId: "1:564585755298:web:0304e8bb9b6a64bbd69dfb"
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore targeting the specific provisioned databaseId as the third argument
export const db = initializeFirestore(app, {}, "ai-studio-455b289c-c350-469f-9586-e5004d1ef73b");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const jsonStr = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonStr);
  throw new Error(jsonStr);
}

export { 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged 
};
export type { User };
