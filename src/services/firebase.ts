import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
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
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  databaseURL: (firebaseAppletConfig as any).databaseURL || `https://${firebaseAppletConfig.projectId}-default-rtdb.firebaseio.com`
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/presentations.readonly',
];

export const googleProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => googleProvider.addScope(scope));
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
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Capture user's specific Google OAuth Access Token
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error('Google OAuth access token was not returned. Please try signing in again.');
  }

  // Cache the OAuth access token in-memory in GoogleDriveService
  GoogleDriveService.setToken(accessToken);

  let privateFolder: GoogleDriveFolder = {
    id: 'folder-nebula-workstation',
    name: DEDICATED_DRIVE_FOLDER_NAME,
    webViewLink: 'https://drive.google.com/drive/my-drive'
  };
  try {
    const folderPromise = GoogleDriveService.getOrCreatePrivateFolder();
    const timeoutPromise = new Promise<GoogleDriveFolder>((resolve) => 
      setTimeout(() => resolve(privateFolder), 2500)
    );
    privateFolder = await Promise.race([folderPromise, timeoutPromise]);
  } catch (driveErr) {
    console.warn('Google Drive private folder notice:', driveErr);
  }

  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
    isGuest: false,
    driveFolder: privateFolder
  };

  // Sync user profile in background without blocking the UI
  setTimeout(() => {
    try {
      const userDocRef = doc(db, 'workspaces', user.uid);
      setDoc(userDocRef, {
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
      }, { merge: true }).catch(() => {});
    } catch {}

    try {
      const userRtdbRef = ref(rtdb, `users/${user.uid}/driveFolder`);
      rtdbSet(userRtdbRef, {
        folderId: privateFolder?.id || '',
        folderName: privateFolder?.name || DEDICATED_DRIVE_FOLDER_NAME,
        webViewLink: privateFolder?.webViewLink || '',
        lastConnected: new Date().toISOString()
      }).catch(() => {});
    } catch {}
  }, 10);

  try {
    localStorage.setItem('nebula_os_user', JSON.stringify(profile));
  } catch {}

  return profile;
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
      setDoc(userDocRef, {
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
      }, { merge: true }).catch(() => {});

      // 2. Save to Realtime Database for live cross-device sync & instant updates
      try {
        const userRef = ref(rtdb, `users/${uid}/workspace`);
        rtdbSet(userRef, {
          updatedAt: rtdbServerTimestamp(),
          lastActive: new Date().toISOString(),
          stateSummary: {
            filesCount: state.files?.length || 0,
            settings: state.settings || {},
            openWindows: (state.windows || []).map((w: any) => w.title),
            googleDriveFolderName: driveFolder?.name || DEDICATED_DRIVE_FOLDER_NAME
          },
          cloudData: JSON.stringify(state)
        }).catch(() => {});

        const filesRef = ref(rtdb, `users/${uid}/files`);
        rtdbSet(filesRef, {
          updatedAt: rtdbServerTimestamp(),
          items: state.files || []
        }).catch(() => {});
      } catch {
        // RTDB mirror is non-blocking
      }

      return true;
    } catch (err) {
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
    } catch {
      // fallback to local
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
          } catch {
            // ignore JSON parse issue
          }
        }
      });
    } catch {
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
      }).catch(() => {});
    } catch {
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
