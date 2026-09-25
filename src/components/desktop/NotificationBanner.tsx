import React, { useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Cloud, 
  Info, 
  X 
} from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const { notifications, dismissNotification, settings } = useOS();

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        dismissNotification(notifications[notifications.length - 1].id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'thermal':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'render':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'sync':
        return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed top-9 right-4 z-50 flex flex-col space-y-2 pointer-events-none select-none max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto p-3 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-start space-x-3 text-xs transition-all duration-300 animate-in slide-in-from-right-4 ${
            settings.theme === 'dark' 
              ? 'bg-neutral-800/85 text-neutral-200 border-white/15' 
              : 'bg-white/85 text-neutral-800 border-black/15'
          }`}
        >
          <div className="p-1 rounded-lg bg-black/10 dark:bg-white/10 mt-0.5">
            {getIcon(n.type)}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-xs">{n.title}</h5>
              <span className="text-[10px] opacity-50">{n.timestamp}</span>
            </div>
            <p className="text-[11px] opacity-75 mt-0.5 leading-snug">{n.message}</p>
          </div>

          <button
            onClick={() => dismissNotification(n.id)}
            className="p-1 rounded hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
