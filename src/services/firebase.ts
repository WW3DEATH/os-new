import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set as rtdbSet, 
  onValue, 
  serverTimestamp as rtdbServerTimestamp 
} from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCDGv7Bk7_OFNzAiANO7ECXsdHc1-3fkBY",
  authDomain: "cloud-os-6a14c.firebaseapp.com",
  databaseURL: "https://cloud-os-6a14c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cloud-os-6a14c",
  storageBucket: "cloud-os-6a14c.firebasestorage.app",
  messagingSenderId: "29564180792",
  appId: "1:29564180792:web:41163ebdb09b05cf1a09cd",
  measurementId: "G-3659MX2KLK"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isGuest?: boolean;
}

// Google Sign-In with fallback helper
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Creative Producer',
      email: user.email || 'user@nebulaos.pro',
      photoURL: user.photoURL || undefined,
      isGuest: false,
    };
    // Sync user session to local storage for offline readiness
    localStorage.setItem('nebula_os_user', JSON.stringify(profile));
    return profile;
  } catch (error: any) {
    console.warn('Firebase popup sign-in encountered error, checking if user canceled or popup blocked:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error('Sign out error', err);
  }
  localStorage.removeItem('nebula_os_user');
}

// Cloud Backup & Offline Synchronization Engine
export class CloudSyncService {
  private static localKey = 'nebula_os_storage_v1';

  static loadLocal(): any {
    try {
      const data = localStorage.getItem(this.localKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveLocal(state: any) {
    try {
      localStorage.setItem(this.localKey, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Backup state to Firebase Realtime Database and Firestore
  static async backupToCloud(uid: string, state: any): Promise<boolean> {
    this.saveLocal(state);
    if (!uid || uid.startsWith('guest-')) {
      return true; // Saved locally for guests
    }

    try {
      // 1. Save to Realtime Database for instant collaboration & live state
      const userRef = ref(rtdb, `users/${uid}/workspace`);
      await rtdbSet(userRef, {
        updatedAt: rtdbServerTimestamp(),
        stateSummary: {
          filesCount: state.files?.length || 0,
          settings: state.settings || {},
          openWindows: (state.windows || []).map((w: any) => w.title),
        },
        cloudData: JSON.stringify(state)
      });

      // 2. Also mirror to Firestore for structured persistence
      const userDocRef = doc(db, 'workspaces', uid);
      await setDoc(userDocRef, {
        lastSynced: new Date().toISOString(),
        settings: state.settings || {},
        files: state.files || [],
        shortcuts: state.shortcuts || {},
        notes: state.notes || [],
      }, { merge: true });

      return true;
    } catch (err) {
      console.warn('Cloud sync error (will continue offline):', err);
      return false;
    }
  }

  // Restore state from cloud or offline cache
  static async restoreState(uid: string): Promise<any> {
    const local = this.loadLocal();
    if (!uid || uid.startsWith('guest-')) {
      return local;
    }

    try {
      const userDocRef = doc(db, 'workspaces', uid);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        return {
          ...local,
          ...cloudData,
        };
      }
    } catch (err) {
      console.warn('Could not fetch cloud data, using local cache:', err);
    }

    return local;
  }

  // Real-time team collaboration presence
  static broadcastPresence(uid: string, userName: string, activeApp: string) {
    if (!uid || uid.startsWith('guest-')) return;
    try {
      const presenceRef = ref(rtdb, `presence/${uid}`);
      rtdbSet(presenceRef, {
        name: userName,
        activeApp,
        lastSeen: Date.now(),
      });
    } catch (e) {
      // Ignore background presence failures
    }
  }

  static subscribeToTeamPresence(callback: (members: any[]) => void) {
    try {
      const presenceRef = ref(rtdb, 'presence');
      return onValue(presenceRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          callback([]);
          return;
        }
        const now = Date.now();
        const active = Object.entries(val)
          .map(([id, data]: [string, any]) => ({ id, ...data }))
          .filter((m: any) => now - (m.lastSeen || 0) < 60000);
        callback(active);
      });
    } catch {
      return () => {};
    }
  }
}
