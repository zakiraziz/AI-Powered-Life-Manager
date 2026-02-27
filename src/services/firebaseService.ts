import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  enableIndexedDbPersistence,
  FirestoreError,
  QueryDocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import type { FirebaseConfig } from '../types';

// Firebase configuration - replace with your own config
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err: FirestoreError) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
      }
    });
  }
  return { app, auth, db };
};

// Lazy initialization
const getFirebase = () => {
  if (!app) {
    initializeFirebase();
  }
  return { app, auth: auth!, db: db! };
};

// Export initialized services
export const getAuthInstance = () => {
  const { auth: firebaseAuth } = getFirebase();
  return firebaseAuth;
};

export const getFirestoreInstance = () => {
  const { db: firestore } = getFirebase();
  return firestore;
};

// Re-export Firebase instances
export const firebaseAuth = {
  get auth() {
    return getAuthInstance();
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    const { auth } = getFirebase();
    return signInWithEmailAndPassword(auth, email, password);
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    const { auth } = getFirebase();
    return createUserWithEmailAndPassword(auth, email, password);
  },
  signOut: async () => {
    const { auth } = getFirebase();
    return signOut(auth);
  },
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, callback);
  },
};

export const firebaseDb = {
  get db() {
    return getFirestoreInstance();
  },
  collection: (collectionName: string) => {
    const { db } = getFirebase();
    return collection(db, collectionName);
  },
  doc: (collectionName: string, docId: string) => {
    const { db } = getFirebase();
    return doc(db, collectionName, docId);
  },
};

// Database helper functions
export const dbHelpers = {
  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    const { db } = getFirebase();
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  },

  async getCollection<T extends { id?: string }>(collectionName: string, constraints?: {
    where?: [string, '<' | '<=' | '==' | '>' | '>=' | 'array-contains', unknown][];
    orderBy?: [string, 'asc' | 'desc'][];
    limit?: number;
  }): Promise<T[]> {
    const { db } = getFirebase();
    let q: ReturnType<typeof query> = collection(db, collectionName);
    
    if (constraints) {
      const queries: QueryConstraint[] = [];
      
      if (constraints.where) {
        constraints.where.forEach(([field, operator, value]) => {
          queries.push(where(field, operator, value));
        });
      }
      
      if (constraints.orderBy) {
        constraints.orderBy.forEach(([field, direction]) => {
          queries.push(orderBy(field, direction));
        });
      }
      
      if (constraints.limit) {
        queries.push(limit(constraints.limit));
      }
      
      q = query(q, ...queries);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docItem) => ({ 
      id: docItem.id, 
      ...(docItem.data() as Record<string, unknown>)
    })) as T[];
  },

  async setDocument(collectionName: string, docId: string, data: Record<string, unknown>): Promise<void> {
    const { db } = getFirebase();
    const docData = { ...data } as Record<string, unknown>;
    await setDoc(doc(db, collectionName, docId), {
      ...docData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  async updateDocument(collectionName: string, docId: string, data: Record<string, unknown>): Promise<void> {
    const { db } = getFirebase();
    const docData = { ...data } as Record<string, unknown>;
    await updateDoc(doc(db, collectionName, docId), {
      ...docData,
      updatedAt: Timestamp.now(),
    });
  },

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const { db } = getFirebase();
    await deleteDoc(doc(db, collectionName, docId));
  },
};

export { app, auth, db };
