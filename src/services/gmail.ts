/**
 * Gmail Client-Side Workspace Integration Service
 * 
 * Interacts directly with the official Google Gmail REST API (v1)
 * using the user's Google OAuth Bearer access token.
 * 
 * Required Scopes:
 * - https://www.googleapis.com/auth/gmail.readonly
 * - https://www.googleapis.com/auth/gmail.send
 * - https://www.googleapis.com/auth/gmail.compose
 */

import { GoogleDriveService } from './googleDrive';

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet: string;
  sender: string;
  senderEmail: string;
  to: string;
  subject: string;
  date: string;
  rawDate: number;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  folder: 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash';
}

function base64UrlDecode(str: string): string {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    try {
      return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export class GmailService {
  /**
   * Check if an active Google OAuth token is available.
   */
  static isConnected(): boolean {
    return GoogleDriveService.isConnected();
  }

  /**
   * Get user's active Google OAuth Bearer token.
   */
  static getToken(): string | null {
    return GoogleDriveService.getToken();
  }

  /**
   * Fetch user's Gmail messages from the official Gmail API.
   */
  static async listMessages(options: {
    folder?: 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash';
    query?: string;
    maxResults?: number;
  } = {}): Promise<GmailMessageItem[]> {
    const token = this.getToken();
    if (!token) return [];

    const { folder = 'inbox', query = '', maxResults = 25 } = options;

    try {
      let q = query.trim();
      if (folder === 'inbox') {
        q = q ? `in:inbox ${q}` : 'in:inbox';
      } else if (folder === 'sent') {
        q = q ? `in:sent ${q}` : 'in:sent';
      } else if (folder === 'starred') {
        q = q ? `is:starred ${q}` : 'is:starred';
      } else if (folder === 'drafts') {
        q = q ? `in:draft ${q}` : 'in:draft';
      } else if (folder === 'trash') {
        q = q ? `in:trash ${q}` : 'in:trash';
      }

      const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(q)}`;

      const listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!listRes.ok) {
        console.warn(`Gmail API listMessages error (${listRes.status}):`, await listRes.text().catch(() => ''));
        return [];
      }

      const listData = await listRes.json();
      if (!listData.messages || listData.messages.length === 0) {
        return [];
      }

      // Fetch individual message details in parallel
      const messageDetailPromises = listData.messages.slice(0, maxResults).map(async (item: { id: string }) => {
        try {
          const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`;
          const detailRes = await fetch(detailUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!detailRes.ok) return null;
          const msg = await detailRes.json();
          return this.parseGmailMessage(msg);
        } catch (err) {
          console.warn('Error fetching Gmail message item detail:', err);
          return null;
        }
      });

      const resolved = await Promise.all(messageDetailPromises);
      return resolved.filter((m): m is GmailMessageItem => m !== null);
    } catch (err) {
      console.warn('Error fetching messages from Gmail API:', err);
      return [];
    }
  }

  /**
   * Parse a raw Gmail API message JSON payload into a structured GmailMessageItem.
   */
  private static parseGmailMessage(msg: any): GmailMessageItem {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => {
      const h = headers.find((header: any) => header.name?.toLowerCase() === name.toLowerCase());
      return h ? h.value : '';
    };

    const fromHeader = getHeader('From');
    let senderName = fromHeader;
    let senderEmail = fromHeader;
    if (fromHeader.includes('<')) {
      const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
      if (match) {
        senderName = match[1].replace(/["']/g, '').trim() || match[2];
        senderEmail = match[2].trim();
      }
    }

    const toHeader = getHeader('To');
    const subject = getHeader('Subject') || '(No Subject)';
    const dateStr = getHeader('Date');
    const rawDate = msg.internalDate ? parseInt(msg.internalDate, 10) : (dateStr ? new Date(dateStr).getTime() : Date.now());

    // Format display date
    const d = new Date(rawDate);
    const isToday = new Date().toDateString() === d.toDateString();
    const formattedDate = isToday 
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Extract body text
    let body = '';
    if (msg.payload?.body?.data) {
      body = base64UrlDecode(msg.payload.body.data);
    } else if (msg.payload?.parts) {
      const findTextPart = (parts: any[]): string => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return base64UrlDecode(part.body.data);
          }
          if (part.parts) {
            const nested = findTextPart(part.parts);
            if (nested) return nested;
          }
        }
        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            const html = base64UrlDecode(part.body.data);
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
        return '';
      };
      body = findTextPart(msg.payload.parts);
    }

    if (!body) {
      body = msg.snippet || '';
    }

    const labelIds: string[] = msg.labelIds || [];
    const isRead = !labelIds.includes('UNREAD');
    const isStarred = labelIds.includes('STARRED');

    let folder: 'inbox' | 'sent' | 'starred' | 'drafts' | 'trash' = 'inbox';
    if (labelIds.includes('TRASH')) folder = 'trash';
    else if (labelIds.includes('DRAFT')) folder = 'drafts';
    else if (labelIds.includes('SENT')) folder = 'sent';
    else if (labelIds.includes('STARRED')) folder = 'starred';

    return {
      id: msg.id,
      threadId: msg.threadId,
      snippet: msg.snippet || body.slice(0, 100),
      sender: senderName || 'Google User',
      senderEmail,
      to: toHeader,
      subject,
      date: formattedDate,
      rawDate,
      body,
      isRead,
      isStarred,
      labels: labelIds,
      folder
    };
  }

  /**
   * Send an email via the user's authenticated Google Account using Gmail API.
   * NOTE: Call this only after receiving explicit user confirmation in UI.
   */
  static async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ id: string; threadId?: string }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Gmail is not connected. Please sign in with your Google Account.');
    }

    const { to, subject, body } = params;

    // Build RFC 2822 email format
    const emailLines = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      body
    ];

    const rawMessage = emailLines.join('\r\n');
    const encodedRaw = base64UrlEncode(rawMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedRaw
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || `Gmail API returned status ${response.status}`;
      throw new Error(msg);
    }

    return await response.json();
  }

  /**
   * Move email to trash via Gmail API.
   * NOTE: Call this only after explicit user confirmation in UI.
   */
  static async trashMessage(id: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) return true;

    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Star / unstar message in Gmail.
   */
  static async toggleStar(id: string, isStarred: boolean): Promise<boolean> {
    const token = this.getToken();
    if (!token) return true;

    try {
      const body = isStarred 
        ? { removeLabelIds: ['STARRED'] }
        : { addLabelIds: ['STARRED'] };

      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
