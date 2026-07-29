import React, { useEffect, useState, useRef } from 'react';
import { AppSettings } from '../types';
import { DEFAULT_CHURCH_LOGO } from '../data/initialData';

interface SplashScreenProps {
  settings: AppSettings;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ settings, onFinish }) => {
  const [progress, setProgress] = useState(1);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const totalDuration = 3000; // 3 seconds total loading delay
    const intervalTime = 30; // update every 30ms (~100 steps)
    const increment = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            if (onFinishRef.current) {
              onFinishRef.current();
            }
          }, 150); // slight smooth fade
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const churchLogo = settings.logo || (settings as any).logo_url || DEFAULT_CHURCH_LOGO;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#090d16] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full space-y-6 text-center animate-fade-in">
        {/* Church Registered Logo */}
        <div className="relative group">
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 blur opacity-80 animate-pulse" />
          <img
            src={churchLogo}
            alt={settings.nama_gereja || 'Logo Gereja'}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
            }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-2 border-white/20 shadow-2xl bg-slate-900 p-1"
          />
        </div>

        {/* Church Name & Description */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            {settings.nama_gereja || 'Gereja CMS Pro'}
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold">
            Sistem Informasi Management Gereja
          </p>
        </div>

        {/* Animated Loading Bar & Counter (1 to 100) */}
        <div className="w-full space-y-2.5 pt-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
            <span className="text-indigo-300">Memuat Sistem...</span>
            <span className="font-mono text-indigo-400 text-sm font-extrabold">
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800/90 rounded-full border border-white/10 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-75 ease-out shadow-lg shadow-indigo-500/50"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium pt-2">
          Enterprise CMS Pro • Ready Offline & Realtime
        </p>
      </div>
    </div>
  );
};
