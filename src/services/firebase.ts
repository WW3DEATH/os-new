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
  getDoc 
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set as rtdbSet, 
  onValue, 
  serverTimestamp as rtdbServerTimestamp 
} from 'firebase/database';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import { GoogleDriveService, GoogleDriveFolder, DEDICATED_DRIVE_FOLDER_NAME } from './googleDrive';

export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyBO0asfdvUv8BqsoFNEb-SM-o1CrIKyBgw",
  authDomain: firebaseAppletConfig.authDomain || "gen-lang-client-0137150734.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "gen-lang-client-0137150734",
  storageBucket: firebaseAppletConfig.storageBucket || "gen-lang-client-0137150734.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "778138590254",
  appId: firebaseAppletConfig.appId || "1:778138590254:web:251568112d52b3bec1d3bf",
  databaseURL: (firebaseAppletConfig as any).databaseURL || `https://cloud-os-6a14c-default-rtdb.asia-southeast1.firebasedatabase.app`
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isGuest?: boolean;
  driveFolder?: GoogleDriveFolder;
}

// Google Sign-In with OAuth token capture and Private Google Drive folder configuration
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Capture user's specific Google OAuth Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      throw new Error('Google OAuth access token was not returned. Please grant access in the sign-in popup.');
    }

    // Cache the OAuth access token in-memory in GoogleDriveService
    GoogleDriveService.setToken(accessToken);

    // Retrieve or provision the user's dedicated private Google Drive folder ('NebulaOS Workstation')
    let privateFolder: GoogleDriveFolder | undefined = undefined;
    try {
      privateFolder = await GoogleDriveService.getOrCreatePrivateFolder();
    } catch (driveErr) {
      console.warn('Could not auto-create Google Drive private folder at sign-in:', driveErr);
      privateFolder = {
        id: '',
        name: DEDICATED_DRIVE_FOLDER_NAME,
        webViewLink: 'https://drive.google.com'
      };
    }

    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      isGuest: false,
      driveFolder: privateFolder
    };

    // Sync user profile & Google Drive private folder metadata to Firebase Firestore
    try {
      const userDocRef = doc(db, 'workspaces', user.uid);
      await setDoc(userDocRef, {
        userEmail: user.email,
        userDisplayName: profile.displayName,
        photoURL: profile.photoURL || null,
        lastLogin: new Date().toISOString(),
        googleDriveFolder: privateFolder ? {
          id: privateFolder.id,
          name: privateFolder.name,
          webViewLink: privateFolder.webViewLink,
          updatedAt: new Date().toISOString()
        } : null
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore user profile sync notice:', e);
    }

    // Also mirror to Realtime Database if available
    try {
      const userRtdbRef = ref(rtdb, `users/${user.uid}/driveFolder`);
      await rtdbSet(userRtdbRef, {
        folderId: privateFolder?.id || '',
        folderName: privateFolder?.name || DEDICATED_DRIVE_FOLDER_NAME,
        webViewLink: privateFolder?.webViewLink || '',
        lastConnected: new Date().toISOString()
      });
    } catch (e) {
      // RTDB optional fallback
    }

    localStorage.setItem('nebula_os_user', JSON.stringify(profile));
    return profile;
  } catch (error: any) {
    console.warn('Google sign-in encountered an issue:', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error('Sign out error', err);
  }
  GoogleDriveService.setToken(null);
  GoogleDriveService.clearPrivateFolder();
  localStorage.removeItem('nebula_os_user');
}

// Cloud Backup & Realtime Database Synchronization Engine
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
      return true;
    }

    const driveFolder = GoogleDriveService.getPrivateFolder();

    try {
      // 1. Mirror to Firestore for persistent document history
      const userDocRef = doc(db, 'workspaces', uid);
      await setDoc(userDocRef, {
        lastSynced: new Date().toISOString(),
        settings: state.settings || {},
        files: state.files || [],
        shortcuts: state.shortcuts || {},
        notes: state.notes || [],
        googleDriveFolder: driveFolder ? {
          id: driveFolder.id,
          name: driveFolder.name,
          webViewLink: driveFolder.webViewLink,
          syncedAt: new Date().toISOString()
        } : null
      }, { merge: true });

      // 2. Save to Realtime Database for live cross-device sync & instant updates
      try {
        const userRef = ref(rtdb, `users/${uid}/workspace`);
        await rtdbSet(userRef, {
          updatedAt: rtdbServerTimestamp(),
          lastActive: new Date().toISOString(),
          stateSummary: {
            filesCount: state.files?.length || 0,
            settings: state.settings || {},
            openWindows: (state.windows || []).map((w: any) => w.title),
            googleDriveFolderName: driveFolder?.name || DEDICATED_DRIVE_FOLDER_NAME
          },
          cloudData: JSON.stringify(state)
        });

        const filesRef = ref(rtdb, `users/${uid}/files`);
        await rtdbSet(filesRef, {
          updatedAt: rtdbServerTimestamp(),
          items: state.files || []
        });
      } catch (rtdbErr) {
        // RTDB mirror is non-blocking
      }

      return true;
    } catch (err) {
      console.warn('Cloud sync error (persisted locally):', err);
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

  // Listen to realtime database updates for the logged in user
  static subscribeToRealtimeWorkspace(uid: string, onUpdate: (data: any) => void) {
    if (!uid || uid.startsWith('guest-')) return () => {};
    try {
      const userRef = ref(rtdb, `users/${uid}/workspace`);
      return onValue(userRef, (snapshot) => {
        const val = snapshot.val();
        if (val?.cloudData) {
          try {
            const parsed = JSON.parse(val.cloudData);
            onUpdate(parsed);
          } catch (e) {
            console.warn('Failed parsing realtime workspace data:', e);
          }
        }
      });
    } catch (err) {
      return () => {};
    }
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
