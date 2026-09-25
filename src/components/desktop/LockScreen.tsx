import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Cloud, 
  HardDrive, 
  User, 
  Sparkles,
  Wifi,
  BatteryMedium
} from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { user, loginWithGoogle, loginAsGuest, settings } = useOS();
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError('Sign-in popup closed or restricted in iframe. You can enter instantly via Guest Creative bypass below.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGuestBypass = () => {
    loginAsGuest();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 select-none bg-cover bg-center transition-all duration-500"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${settings.wallpaper}')`,
      }}
    >
      {/* Top Status Indicators */}
      <div className="w-full flex justify-between items-center text-white/80 text-xs px-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">NebulaOS Creative Workstation (macOS Edition)</span>
        </div>
        <div className="flex items-center space-x-3">
          <Wifi className="w-4 h-4" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>

      {/* Center Clock & Authentication Card */}
      <div className="flex flex-col items-center space-y-6 my-auto max-w-sm w-full">
        {/* Large macOS Clock */}
        <div className="text-center text-white">
          <div className="text-7xl font-extralight tracking-tight font-sans drop-shadow-lg">
            {currentTime}
          </div>
          <div className="text-sm font-medium opacity-90 mt-1 drop-shadow">
            {currentDate}
          </div>
        </div>

        {/* User Avatar & Login Container */}
        <div className="flex flex-col items-center space-y-4 w-full p-6 rounded-3xl bg-neutral-900/60 backdrop-blur-2xl border border-white/15 shadow-2xl text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 p-0.5 shadow-xl">
            <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-white/90" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              {user?.displayName || 'Creative Producer'}
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Firebase Project: <span className="font-mono text-emerald-400">cloud-os-6a14c</span>
            </p>
          </div>

          {/* Error notice if popup was closed */}
          {authError && (
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] leading-relaxed">
              {authError}
            </div>
          )}

          {/* Primary Action: Google Sign-in */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs flex items-center justify-center space-x-2.5 shadow-lg active:scale-95 transition-all"
          >
            {/* Google "G" Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{isAuthenticating ? 'Connecting Google Account...' : 'Sign In with Google Account'}</span>
          </button>

          {/* Bypass / Guest Access Option */}
          <button
            onClick={handleGuestBypass}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors border border-white/10"
          >
            <span>Enter as Guest Creative (Bypass Mode)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer info: Google Drive connection notice & offline sync */}
      <div className="text-center text-white/60 text-[11px] max-w-md space-y-1">
        <p className="flex items-center justify-center space-x-1.5">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connects directly to your Google Drive with Zero host storage consumption.</span>
        </p>
        <p className="opacity-75">
          Offline synchronization active with automatic cloud backups on change.
        </p>
      </div>
    </div>
  );
};
