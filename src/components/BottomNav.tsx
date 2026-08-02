import React from 'react';
import { NavTab } from './Sidebar';
import { User, AppSettings } from '../types';
import { LayoutDashboard, Users, CalendarDays, BookOpen, MoreHorizontal, UserCheck } from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser?: User | null;
  onOpenMobileMenu: () => void;
  settings?: AppSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenMobileMenu,
  settings
}) => {
  const isJemaat = (currentUser?.role || 'JEMAAT') === 'JEMAAT';

  let rawHex = (settings?.warna_tema || '#CD5C5C').trim();
  if (!rawHex.startsWith('#')) {
    rawHex = `#${rawHex}`;
  }
  const customHex = rawHex;

  const getItemStyle = (isActive: boolean) => {
    if (isActive) {
      return {
        color: customHex,
        backgroundColor: `${customHex}20`,
        borderColor: `${customHex}50`
      };
    }
    return {};
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 lg:hidden px-3 py-2 flex items-center justify-around text-slate-400 shadow-2xl">
      {/* 1. HOME */}
      <button
        onClick={() => onSelectTab('dashboard')}
        style={getItemStyle(activeTab === 'dashboard')}
        className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer border border-transparent ${
          activeTab === 'dashboard' ? 'font-black scale-105 shadow-md' : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      {/* 2. RENUNGAN */}
      <button
        onClick={() => onSelectTab('renungan')}
        style={getItemStyle(activeTab === 'renungan')}
        className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer border border-transparent ${
          activeTab === 'renungan' ? 'font-black scale-105 shadow-md' : 'hover:text-slate-200'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span>Renungan</span>
      </button>

      {/* 3. JADWAL */}
      <button
        onClick={() => onSelectTab('jadwal')}
        style={getItemStyle(activeTab === 'jadwal' || activeTab === 'agenda')}
        className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer border border-transparent ${
          activeTab === 'jadwal' || activeTab === 'agenda' ? 'font-black scale-105 shadow-md' : 'hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Jadwal</span>
      </button>

      {/* 4. PROFIL (for Jemaat) or JEMAAT (for Admin/SuperAdmin) */}
      {isJemaat ? (
        <button
          onClick={() => onSelectTab('jemaat_portal')}
          style={getItemStyle(activeTab === 'jemaat_portal')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer border border-transparent ${
            activeTab === 'jemaat_portal' ? 'font-black scale-105 shadow-md' : 'hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span>Profil</span>
        </button>
      ) : (
        <button
          onClick={() => onSelectTab('jemaat')}
          style={getItemStyle(activeTab === 'jemaat')}
          className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer border border-transparent ${
            activeTab === 'jemaat' ? 'font-black scale-105 shadow-md' : 'hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Jemaat</span>
        </button>
      )}

      {/* 5. LAINNYA */}
      <button
        onClick={() => onSelectTab('lainnya')}
        style={getItemStyle(activeTab === 'lainnya')}
        className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer border border-transparent ${
          activeTab === 'lainnya' ? 'font-black scale-105 shadow-md' : 'hover:text-slate-200'
        }`}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>Lainnya</span>
      </button>
    </div>
  );
};
