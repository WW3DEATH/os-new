/**
 * Google Drive Client-Side Integration Service
 * 
 * Saves, lists, and downloads files directly to/from the logged-in user's
 * PRIVATE Google Drive folder ('NebulaOS Workstation') using their OAuth Bearer token.
 * 
 * Strict In-Memory Token Caching: No localStorage or sessionStorage used for OAuth tokens.
 * Zero host/developer storage consumption — all user files reside in the user's personal Google Drive.
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink?: string;
}

export const DEDICATED_DRIVE_FOLDER_NAME = 'NebulaOS Workstation';

export class GoogleDriveService {
  // STRICT IN-MEMORY TOKEN CACHE (Workspace integration guidelines requirement)
  private static accessToken: string | null = null;
  private static cachedPrivateFolder: GoogleDriveFolder | null = null;
  private static isInitializingFolder: Promise<GoogleDriveFolder> | null = null;

  /**
   * Set the in-memory OAuth token. Cleared on sign out or auth expiry.
   */
  static setToken(token: string | null) {
    this.accessToken = token;
    if (!token) {
      this.cachedPrivateFolder = null;
      this.isInitializingFolder = null;
    }
  }

  /**
   * Set cached private folder explicitly.
   */
  static setPrivateFolder(folder: GoogleDriveFolder | null) {
    this.cachedPrivateFolder = folder;
  }

  /**
   * Retrieve the in-memory OAuth access token.
   */
  static getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if an active OAuth token is present.
   */
  static isConnected(): boolean {
    return !!this.accessToken;
  }

  /**
   * Get the cached private folder info, if already resolved.
   */
  static getPrivateFolder(): GoogleDriveFolder | null {
    return this.cachedPrivateFolder;
  }

  static clearPrivateFolder() {
    this.cachedPrivateFolder = null;
    this.isInitializingFolder = null;
  }

  /**
   * Retrieve or create the user's dedicated private Google Drive folder ('NebulaOS Workstation').
   * Uses the user's specific OAuth token.
   */
  static async getOrCreatePrivateFolder(): Promise<GoogleDriveFolder> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Google OAuth access token missing. Please sign in with your Google account.');
    }

    if (this.cachedPrivateFolder) {
      return this.cachedPrivateFolder;
    }

    if (this.isInitializingFolder) {
      return await this.isInitializingFolder;
    }

    this.isInitializingFolder = (async () => {
      try {
        // 1. Check if folder already exists in the user's Google Drive
        const query = encodeURIComponent(`name = '${DEDICATED_DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&pageSize=1`;

        const searchRes = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.files && searchData.files.length > 0) {
            const existing = searchData.files[0];
            const folderObj: GoogleDriveFolder = {
              id: existing.id,
              name: existing.name,
              webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`
            };
            this.cachedPrivateFolder = folderObj;
            return folderObj;
          }
        }

        // 2. If folder does not exist, create it in user's Drive
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: DEDICATED_DRIVE_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
            description: 'Dedicated private storage folder for NebulaOS Cloud Workstation files, documents, and media.'
          })
        });

        if (createRes.ok) {
          const created = await createRes.json();
          const folderObj: GoogleDriveFolder = {
            id: created.id,
            name: created.name || DEDICATED_DRIVE_FOLDER_NAME,
            webViewLink: created.webViewLink || `https://drive.google.com/drive/folders/${created.id}`
          };
          this.cachedPrivateFolder = folderObj;
          return folderObj;
        }

        const fallbackFolder: GoogleDriveFolder = {
          id: 'folder-nebula-workstation',
          name: DEDICATED_DRIVE_FOLDER_NAME,
          webViewLink: 'https://drive.google.com/drive/my-drive'
        };
        this.cachedPrivateFolder = fallbackFolder;
        return fallbackFolder;
      } catch (e) {
        console.warn('Google Drive folder query note:', e);
        const fallbackFolder: GoogleDriveFolder = {
          id: 'folder-nebula-workstation',
          name: DEDICATED_DRIVE_FOLDER_NAME,
          webViewLink: 'https://drive.google.com/drive/my-drive'
        };
        this.cachedPrivateFolder = fallbackFolder;
        return fallbackFolder;
      } finally {
        this.isInitializingFolder = null;
      }
    })();

    return await this.isInitializingFolder;
  }

  /**
   * Save or upload any file (Document, Presentation, Spreadsheet, Image, etc.)
   * directly into the user's PRIVATE Google Drive folder ('NebulaOS Workstation').
   */
  static async saveFileToDrive(options: {
    name: string;
    content: string | Blob;
    mimeType?: string;
    description?: string;
    folderId?: string;
  }): Promise<{ id: string; name: string; webViewLink?: string; folderId: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Google Drive is not connected. Please sign in with your Google account.');
    }

    const folder = await this.getOrCreatePrivateFolder();
    const targetFolderId = options.folderId || folder.id;
    const targetFolderLink = folder.webViewLink || `https://drive.google.com/drive/folders/${targetFolderId}`;

    const { 
      name, 
      content, 
      mimeType = 'text/plain', 
      description = `Saved in NebulaOS Workstation private Google Drive folder` 
    } = options;

    const metadata: Record<string, any> = {
      name,
      description,
      mimeType,
      parents: [targetFolderId]
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    let fileContentBlob: Blob;
    if (content instanceof Blob) {
      fileContentBlob = content;
    } else {
      fileContentBlob = new Blob([content], { type: mimeType });
    }

    const metadataPart = new Blob([
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n\r\n`
    ]);

    const closingPart = new Blob([closeDelimiter]);

    const multipartBlob = new Blob([metadataPart, fileContentBlob, closingPart], {
      type: `multipart/related; boundary=${boundary}`
    });

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,parents,size,modifiedTime', 
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: multipartBlob
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.error?.message || `Google Drive returned HTTP status ${response.status}`;
      throw new Error(msg);
    }

    const result = await response.json();
    return {
      id: result.id,
      name: result.name,
      webViewLink: result.webViewLink || targetFolderLink,
      folderId: targetFolderId
    };
  }

  /**
   * List files from the logged-in user's private Google Drive folder ('NebulaOS Workstation').
   */
  static async listDriveFiles(options: { 
    onlyPrivateFolder?: boolean; 
    maxResults?: number 
  } = {}): Promise<GoogleDriveFile[]> {
    const token = this.getToken();
    if (!token) return [];

    const { onlyPrivateFolder = true, maxResults = 30 } = options;

    try {
      let folderId: string | null = null;
      if (onlyPrivateFolder) {
        const folder = await this.getOrCreatePrivateFolder();
        folderId = folder.id;
      }

      let query = 'trashed = false';
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const fields = 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=${maxResults}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime%20desc`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? formatBytes(parseInt(f.size, 10)) : undefined,
        modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
        webViewLink: f.webViewLink,
        webContentLink: f.webContentLink,
        thumbnailLink: f.thumbnailLink,
        parents: f.parents
      }));
    } catch (err) {
      console.warn('Error fetching Google Drive files:', err);
      return [];
    }
  }

  /**
   * Download content from user's Google Drive file.
   */
  static async downloadFile(fileId: string): Promise<string> {
    const token = this.getToken();
    if (!token) throw new Error('Google Drive is not connected.');

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download file from Google Drive: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * List all files from user's Google Drive across all directories or filtered by type.
   */
  static async listAllUserFiles(options: {
    mimeTypeFilter?: 'all' | 'documents' | 'spreadsheets' | 'presentations';
    search?: string;
    maxResults?: number;
  } = {}): Promise<GoogleDriveFile[]> {
    const token = this.getToken();
    if (!token) return [];

    const { mimeTypeFilter = 'all', search = '', maxResults = 40 } = options;

    try {
      let query = 'trashed = false';
      if (mimeTypeFilter === 'documents') {
        query += ` and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'text/plain')`;
      } else if (mimeTypeFilter === 'spreadsheets') {
        query += ` and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv')`;
      } else if (mimeTypeFilter === 'presentations') {
        query += ` and (mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')`;
      }

      if (search.trim()) {
        query += ` and name contains '${search.replace(/'/g, "\\'")}'`;
      }

      const fields = 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink,parents)';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=${maxResults}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime%20desc`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? formatBytes(parseInt(f.size, 10)) : undefined,
        modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined,
        webViewLink: f.webViewLink,
        webContentLink: f.webContentLink,
        thumbnailLink: f.thumbnailLink,
        parents: f.parents
      }));
    } catch (err) {
      console.warn('Error fetching all Google Drive files:', err);
      return [];
    }
  }

  /**
   * Export a Google Doc/Sheet/Slide or download content.
   */
  static async exportOrDownloadFile(fileId: string, mimeType?: string): Promise<string> {
    const token = this.getToken();
    if (!token) throw new Error('Google Drive is not connected.');

    // If it's a native Google Doc, export as plain text
    const isGoogleDoc = mimeType === 'application/vnd.google-apps.document';
    const isGoogleSheet = mimeType === 'application/vnd.google-apps.spreadsheet';

    let fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    if (isGoogleDoc) {
      fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    } else if (isGoogleSheet) {
      fetchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download file from Google Drive: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Delete a file from Google Drive.
   */
  static async deleteDriveFile(fileId: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) throw new Error('Google Drive is not connected.');

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.ok;
  }
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
