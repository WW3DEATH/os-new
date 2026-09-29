import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { GoogleDriveService, DEDICATED_DRIVE_FOLDER_NAME } from '../../services/googleDrive';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  HardDrive, 
  User, 
  Wifi, 
  BatteryMedium,
  FolderLock,
  Moon,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { sounds } from '../../utils/sound';

export const LockScreen: React.FC = () => {
  const { user, loginWithGoogle, loginAsGuest, settings } = useOS();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAsleep, setIsAsleep] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);

    // Safety timeout so button is never stuck indefinitely on loading
    const timer = setTimeout(() => {
      setIsAuthenticating(false);
      setAuthError('Sign-in took longer than expected. If a popup was blocked or hidden behind your browser, please allow popups and click Sign In with Google.');
    }, 60000);

    try {
      await loginWithGoogle();
      clearTimeout(timer);
      sounds.playChime();
    } catch (err: any) {
      clearTimeout(timer);
      console.warn('Google sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in the Firebase console. Please add this domain under Firebase Authentication > Settings > Authorized domains.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('The sign-in window was closed. Please click Sign In with Google to try again.');
      } else {
        setAuthError(err?.message || 'Google sign-in encountered an error. Please try again.');
      }
      sounds.playBasso();
    } finally {
      clearTimeout(timer);
      setIsAuthenticating(false);
    }
  };

  if (isAsleep) {
    return (
      <div 
        onClick={() => setIsAsleep(false)} 
        className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center cursor-pointer select-none"
      >
        <Moon className="w-10 h-10 text-white/30 animate-pulse mb-4" />
        <p className="text-white/40 text-xs font-mono tracking-widest uppercase">System Asleep • Click anywhere to wake</p>
      </div>
    );
  }

  const isTokenConnected = GoogleDriveService.isConnected();

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-between p-4 sm:p-8 select-none bg-cover bg-center overflow-y-auto transition-all duration-700"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.65), rgba(5, 5, 10, 0.85)), url('${settings.wallpaper}')`,
      }}
    >
      {/* Top macOS Status Bar */}
      <div className="w-full flex justify-between items-center text-white/80 text-xs px-2 sm:px-6 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-3 h-3" />
          </div>
          <span className="font-semibold tracking-wide text-xs">NebulaOS Creative Workstation</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 border border-white/10 font-mono">
            macOS Edition
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google OAuth Protected</span>
          </div>
          <Wifi className="w-4 h-4 text-white/70" />
          <BatteryMedium className="w-4 h-4 text-white/70" />
        </div>
      </div>

      {/* Center Clock & Mandatory Login Card */}
      <div className="flex flex-col items-center space-y-4 sm:space-y-6 my-auto max-w-md w-full px-2 py-4">
        {/* macOS Typography Clock */}
        <div className="text-center text-white">
          <div className="text-6xl sm:text-7xl font-extralight tracking-tight font-sans drop-shadow-2xl">
            {currentTime}
          </div>
          <div className="text-xs sm:text-sm font-light text-white/80 mt-0.5 tracking-wide drop-shadow">
            {currentDate}
          </div>
        </div>

        {/* Glassmorphic Login Overlay Card */}
        <div className="w-full p-6 sm:p-7 rounded-3xl bg-neutral-900/85 backdrop-blur-3xl border border-white/20 shadow-2xl text-center space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Avatar Ring */}
          <div className="relative mx-auto w-20 h-20 sm:w-22 sm:h-22">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center overflow-hidden">
                <User className="w-10 h-10 text-white/80" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-neutral-900">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Authentication Title */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              NebulaOS Workstation Login
            </h2>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              Google OAuth authentication is mandatory to unlock workstation &amp; connect your private Google Drive folder.
            </p>
          </div>

          {/* Google Drive Private Folder Notice Badge */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
              <FolderLock className="w-4 h-4 shrink-0" />
              <span>Private Google Drive Folder: '{DEDICATED_DRIVE_FOLDER_NAME}'</span>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed pl-6">
              All documents, spreadsheets, presentations, and uploaded files are saved strictly in your personal Google Drive folder using your OAuth Bearer token. Zero developer storage consumption.
            </p>
          </div>

          {/* Real-time Guidance Banner when Signing In */}
          {isAuthenticating && (
            <div className="p-3.5 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-200 text-xs text-left space-y-2 animate-in fade-in duration-200">
              <div className="font-semibold flex items-center justify-between text-sky-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>Google Account Popup Open</span>
                </div>
                <span className="text-[10px] opacity-75 font-mono">In Progress</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                When Google loads the verification screen (<strong>"Google hasn't verified this app"</strong>):
              </p>
              <div className="p-2 rounded-xl bg-black/30 border border-white/10 space-y-1 text-[11px]">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-sky-400 shrink-0">1.</span>
                  <span>Click <strong>"Advanced"</strong> (bottom-left of Google's popup).</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-sky-400 shrink-0">2.</span>
                  <span>Click <strong>"Go to M.N.M. Jaasim's Apps (unsafe)"</strong>.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-sky-400 shrink-0">3.</span>
                  <span>Check the permission boxes (Drive, Gmail) and click <strong>"Continue"</strong>.</span>
                </div>
              </div>
              <p className="text-[10px] opacity-70 italic">
                The popup window will close automatically and unlock your workstation.
              </p>
            </div>
          )}

          {/* Authentication Error Banner */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-left space-y-2.5">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">Sign-In Note</div>
                  <div className="leading-relaxed opacity-90">{authError}</div>
                </div>
              </div>

              {/* One-Click Authorized Domain Copy & Firebase Console Helper */}
              {authError.includes('authorized') && typeof window !== 'undefined' && (
                <div className="pt-2 border-t border-amber-500/20 space-y-2">
                  <div className="text-[11px] text-amber-300/90 font-medium">
                    To enable Google Sign-In, add this preview domain to Firebase:
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-amber-500/20 text-[11px] font-mono break-all gap-2">
                    <span className="truncate select-all text-white/90">{window.location.hostname}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.hostname);
                        setDomainCopied(true);
                        setTimeout(() => setDomainCopied(false), 2500);
                      }}
                      className="shrink-0 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-colors cursor-pointer text-[10px]"
                    >
                      {domainCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{domainCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                    <a
                      href="https://console.firebase.google.com/project/gen-lang-client-0942011552/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-medium"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-white/50 text-[10px]">Settings &gt; Authorized domains</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Sign in with Google OR Continue as Guest */}
          <div className="pt-1 space-y-2.5">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
            >
              {isAuthenticating ? (
                <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>
                {isAuthenticating
                  ? 'Connecting Google Account...'
                  : 'Sign In with Google'}
              </span>
            </button>

            {/* Instant Workstation Access: Creator Studio Mode */}
            <button
              type="button"
              onClick={() => loginAsGuest()}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-white/15 text-white font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Enter Workstation (Studio Mode)</span>
            </button>

            {isAuthenticating && (
              <button
                type="button"
                onClick={() => {
                  setIsAuthenticating(false);
                  setAuthError('Sign-in reset. If the Google popup was blocked, please allow popups in your browser and click Sign In with Google.');
                }}
                className="w-full text-center text-[11px] text-white/50 hover:text-white pt-1 transition-colors cursor-pointer"
              >
                Cancel / Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer System Controls */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-white/60 text-xs px-2 sm:px-6 shrink-0">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">Strict OAuth Isolation • Private Drive Sync Active</span>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAsleep(true)}
            className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Sleep</span>
          </button>

          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
