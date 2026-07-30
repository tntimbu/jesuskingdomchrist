import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Users,
  MapPin,
  FileText,
  DollarSign,
  CalendarDays,
  Sparkles,
  Heart,
  Megaphone,
  BookOpen,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Settings,
  UserCheck,
  ChevronRight
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'jemaat'
  | 'wilayah'
  | 'administrasi'
  | 'keuangan'
  | 'jadwal'
  | 'doa'
  | 'pengumuman'
  | 'renungan'
  | 'galeri'
  | 'laporan'
  | 'jemaat_portal'
  | 'settings'
  | 'agenda'
  | 'media';

interface SidebarProps {
  currentUser: User;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuperAdmin;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'jemaat',
      label: 'Data Jemaat & KK',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      id: 'wilayah',
      label: 'Wilayah & Pelayanan',
      icon: MapPin,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      id: 'administrasi',
      label: 'Baptisan, Sidi, Nikah & Surat',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      id: 'keuangan',
      label: 'Persembahan & Kas',
      icon: DollarSign,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      id: 'jadwal',
      label: 'Jadwal Ibadah Rutin',
      icon: CalendarDays,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'agenda',
      label: 'Upcoming Events & Reservasi',
      icon: Sparkles,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'doa',
      label: 'Permohonan Doa',
      icon: Heart,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'pengumuman',
      label: 'Pengumuman Gereja',
      icon: Megaphone,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'renungan',
      label: 'Renungan Harian',
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'galeri',
      label: 'Galeri Foto Kegiatan',
      icon: ImageIcon,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'media',
      label: 'Galeri Video & Streaming',
      icon: Video,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'laporan',
      label: 'Laporan PDF & Excel',
      icon: FileSpreadsheet,
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      id: 'jemaat_portal',
      label: 'Profil Jemaat Saya',
      icon: UserCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'JEMAAT']
    },
    {
      id: 'settings',
      label: 'Pengaturan & Custom Tampilan',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'ADMIN']
    }
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  const content = (
    <aside className="w-64 lg:w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between shrink-0 h-full text-slate-300 overflow-hidden">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Navigation Category Header */}
        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 truncate">
            {currentUser.role === 'JEMAAT' ? 'Menu Portal Jemaat GKFC' : 'Main Menu CMS Pro'}
          </p>
          <nav className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as NavTab);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-md shadow-indigo-500/10'
                      : 'hover:bg-white/5 text-slate-400 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate text-left">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info in sidebar */}
      <div className="p-4 border-t border-white/10 bg-white/5 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium gap-1">
          <span className="shrink-0">Status Database:</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Google Sheets Sync</span>
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-[calc(100vh-5rem)] sticky top-20 z-20">
        {content}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-full bg-slate-900 h-full shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
