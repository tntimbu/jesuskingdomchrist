import React from 'react';
import { NavTab } from './Sidebar';
import { User } from '../types';
import { LayoutDashboard, Users, DollarSign, CalendarDays, BookOpen, MoreHorizontal, UserCheck } from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenMobileMenu
}) => {
  const isJemaat = currentUser.role === 'JEMAAT';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 lg:hidden px-2 py-2 flex items-center justify-around text-slate-400 shadow-2xl">
      {/* 1. HOME */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
          activeTab === 'dashboard' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      {/* 2. RENUNGAN */}
      <button
        onClick={() => onSelectTab('renungan')}
        className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
          activeTab === 'renungan' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
        }`}
      >
        <BookOpen className="w-5 h-5" />
        <span>Renungan</span>
      </button>

      {/* 3. JADWAL */}
      <button
        onClick={() => onSelectTab('jadwal')}
        className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
          activeTab === 'jadwal' || activeTab === 'agenda' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Jadwal</span>
      </button>

      {/* 4. PROFIL (for Jemaat) or JEMAAT/KAS (for Admin) */}
      {isJemaat ? (
        <button
          onClick={() => onSelectTab('jemaat_portal')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'jemaat_portal' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span>Profil</span>
        </button>
      ) : (
        <button
          onClick={() => onSelectTab('jemaat')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${
            activeTab === 'jemaat' ? 'text-indigo-400 font-bold scale-105' : 'hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Jemaat</span>
        </button>
      )}

      {/* 5. LAINNYA */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>Lainnya</span>
      </button>
    </div>
  );
};
