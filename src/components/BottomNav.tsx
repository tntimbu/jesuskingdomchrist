import React from 'react';
import { NavTab } from './Sidebar';
import { User } from '../types';
import { LayoutDashboard, Users, DollarSign, CalendarDays, MoreHorizontal, UserCheck } from 'lucide-react';

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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-2xl border-t border-white/10 lg:hidden px-2 py-1.5 flex items-center justify-around text-slate-400">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-all ${
          activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </button>

      {!isJemaat ? (
        <button
          onClick={() => onSelectTab('jemaat')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-all ${
            activeTab === 'jemaat' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Jemaat</span>
        </button>
      ) : (
        <button
          onClick={() => onSelectTab('jemaat_portal')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-all ${
            activeTab === 'jemaat_portal' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span>Profil</span>
        </button>
      )}

      {!isJemaat && (
        <button
          onClick={() => onSelectTab('keuangan')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-all ${
            activeTab === 'keuangan' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span>Kas</span>
        </button>
      )}

      <button
        onClick={() => onSelectTab('agenda')}
        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-all ${
          activeTab === 'agenda' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Jadwal</span>
      </button>

      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-all"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span>Lainnya</span>
      </button>
    </div>
  );
};
