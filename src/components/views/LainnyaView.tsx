import React from 'react';
import { User, AppSettings } from '../../types';
import { NavTab } from '../Sidebar';
import { getThemeClasses } from '../../utils/themeHelper';
import {
  Users,
  DollarSign,
  FileText,
  Calendar,
  Megaphone,
  BookOpen,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  UserCheck,
  Settings,
  Heart,
  Grid,
  Sparkles,
  MapPin,
  ArrowRight
} from 'lucide-react';

interface LainnyaViewProps {
  currentUser: User;
  onNavigate: (tab: NavTab) => void;
  settings: AppSettings;
}

export const LainnyaView: React.FC<LainnyaViewProps> = ({
  currentUser,
  onNavigate,
  settings
}) => {
  const theme = getThemeClasses(settings);
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  const menuModules = [
    {
      id: 'jemaat_portal' as NavTab,
      title: 'Portal Jemaat Saya',
      subtitle: 'KTA Digital, Sakramen, Doa & Persembahan Saya',
      category: 'PELAYANAN MANDIRI',
      icon: UserCheck,
      gradient: 'from-teal-600 via-emerald-600 to-teal-800',
      badge: 'Jemaat Mandatory',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'jemaat' as NavTab,
      title: 'Data Jemaat & Kartu Keluarga',
      subtitle: 'Database Seluruh Anggota, Sektor & Kepala Keluarga',
      category: 'ADMINISTRASI JEMAAT',
      icon: Users,
      gradient: 'from-blue-600 via-indigo-600 to-blue-800',
      badge: 'Database',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'keuangan' as NavTab,
      title: 'Keuangan & Kas Gereja',
      subtitle: 'Pencatatan Kas, Transfer Bank, QRIS & Laporan Kebendaharaan',
      category: 'KEUANGAN & BENDAHARA',
      icon: DollarSign,
      gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
      badge: 'Kas & QRIS',
      roles: ['ADMIN', 'SUPER_ADMIN', 'JEMAAT']
    },
    {
      id: 'administrasi' as NavTab,
      title: 'Surat Sakramen & Akta',
      subtitle: 'Pengurusan Surat Baptis Kudus, Sidi, Pernikahan & Jemaat',
      category: 'SEKRETARIAT',
      icon: FileText,
      gradient: 'from-purple-600 via-indigo-600 to-purple-800',
      badge: 'Arsip Surat',
      roles: ['ADMIN', 'SUPER_ADMIN', 'JEMAAT']
    },
    {
      id: 'jadwal' as NavTab,
      title: 'Jadwal Ibadah Rutin',
      subtitle: 'Jadwal Kebaktian Minggu, Pelayan Ibadah & Pemusik',
      category: 'IBADAH & PELAYANAN',
      icon: Calendar,
      gradient: 'from-amber-600 via-orange-600 to-amber-800',
      badge: 'Ibadah Minggu',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'agenda' as NavTab,
      title: 'Agenda Events & Reservasi',
      subtitle: 'Jadwal Acara Spesial & Booking Tempat Duduk Ibadah',
      category: 'EVENT & RESERVASI',
      icon: Sparkles,
      gradient: 'from-orange-600 via-amber-600 to-rose-700',
      badge: 'Booking Seat',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'doa' as NavTab,
      title: 'Permohonan Doa & Syafaat',
      subtitle: 'Kirim Pokok Doa Pribadi & Dukungan Komunitas Doa',
      category: 'PELAYANAN DOA',
      icon: Heart,
      gradient: 'from-rose-600 via-pink-600 to-rose-800',
      badge: 'Syafaat',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'renungan' as NavTab,
      title: 'Renungan Harian & Audio',
      subtitle: 'Artikel Firman Tuhan & Audio Podcast Renungan Pagi',
      category: 'ROHANI & MEDIA',
      icon: BookOpen,
      gradient: 'from-cyan-600 via-blue-600 to-cyan-800',
      badge: 'Audio & Teks',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'pengumuman' as NavTab,
      title: 'Warta & Pengumuman',
      subtitle: 'Informasi Warta Minggu & Pengumuman Resmi Gembala',
      category: 'INFORMASI GEREJA',
      icon: Megaphone,
      gradient: 'from-indigo-600 via-blue-600 to-indigo-800',
      badge: 'Warta Minggu',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'galeri' as NavTab,
      title: 'Galeri Foto Kegiatan',
      subtitle: 'Dokumentasi Album Foto Ibadah, Youth & Diakonia',
      category: 'DOKUMENTASI',
      icon: ImageIcon,
      gradient: 'from-fuchsia-600 via-purple-600 to-fuchsia-800',
      badge: 'Album Foto',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'media' as NavTab,
      title: 'Video & Live Streaming',
      subtitle: 'Rekaman Khotbah, Live Broadcast & Video Youtube',
      category: 'MULTIMEDIA',
      icon: Video,
      gradient: 'from-red-600 via-rose-600 to-red-800',
      badge: 'Live Streaming',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'wilayah' as NavTab,
      title: 'Wilayah & Sektor Pelayanan',
      subtitle: 'Pemetaan Sektor Jemaat, Ketua Sektor & Lokasi Ibadah Rumah',
      category: 'ORGANISASI',
      icon: MapPin,
      gradient: 'from-emerald-600 via-lime-600 to-emerald-800',
      badge: 'Sektor',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'laporan' as NavTab,
      title: 'Laporan PDF & Excel',
      subtitle: 'Cetak Laporan Keuangan, Jemaat & Statistik Ibadah',
      category: 'LAPORAN SYSTEM',
      icon: FileSpreadsheet,
      gradient: 'from-blue-700 via-indigo-700 to-slate-800',
      badge: 'Export PDF',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'settings' as NavTab,
      title: 'Pengaturan System & Visual',
      subtitle: 'Kustomisasi Tema, Logo Gereja, Banner & Hak Akses User',
      category: 'SYSTEM ADMIN',
      icon: Settings,
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      badge: 'SuperAdmin',
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  ];

  const filteredModules = menuModules.filter((m) => m.roles.includes(currentUser.role));

  return (
    <div className="space-y-6 pb-6 max-w-7xl mx-auto px-1 sm:px-3 animate-fade-in">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl ${theme.cardClass} text-white border border-white/10 shadow-2xl relative overflow-hidden space-y-3`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/20">
              <Grid className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block">
                Pusat Navigasi Terpadu
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                Menu Utama &amp; Seluruh Modul Pelayanan
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Akses cepat ke semua fitur sistem, portal jemaat, jadwal, keuangan &amp; dokumentasi
              </p>
            </div>
          </div>

          <div className="shrink-0 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{filteredModules.length} Fitur Siap Digunakan</span>
          </div>
        </div>
      </div>

      {/* Grid Menu Utama Wajah Baru (Colorful Quick Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredModules.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-6 rounded-3xl bg-gradient-to-br ${item.gradient} hover:scale-[1.02] border border-white/20 text-left transition-all duration-300 group cursor-pointer shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-5 min-h-[160px]`}
            >
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:bg-white/20 transition-all" />

              <div className="flex items-center justify-between relative z-10">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-xl group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20 uppercase tracking-wider">
                  {item.badge}
                </span>
              </div>

              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-widest block">
                  {item.category}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug group-hover:text-indigo-100 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </h3>
                <p className="text-xs text-white/80 font-medium leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
