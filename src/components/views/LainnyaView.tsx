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
  ArrowRight,
  MessageCircle,
  BookMarked
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

  // Dynamic Theme Preset Style Classes matching Dashboard
  const getCardStyleClass = () => {
    const cardBg = settings.jemaat_cards_bg || 'DEFAULT_GLASS';
    const cardStyle = settings.card_style || 'GLASS';

    let base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';

    if (cardBg && cardBg !== 'DEFAULT_GLASS') {
      switch (cardBg) {
        case 'GRADIENT_INDIGO':
          base = 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/40 shadow-xl shadow-indigo-950/30 backdrop-blur-xl';
          break;
        case 'GRADIENT_PURPLE':
          base = 'bg-gradient-to-br from-purple-950/90 via-slate-900 to-purple-950/90 border border-purple-500/40 shadow-xl shadow-purple-950/30 backdrop-blur-xl';
          break;
        case 'GRADIENT_GOLD':
          base = 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/40 shadow-xl shadow-amber-950/30 backdrop-blur-xl';
          break;
        case 'GRADIENT_EMERALD':
          base = 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 shadow-xl shadow-emerald-950/30 backdrop-blur-xl';
          break;
        case 'OBSIDIAN_NIGHT':
          base = 'bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border border-slate-700/80 shadow-2xl backdrop-blur-xl';
          break;
        case 'OCEAN_BLUE':
          base = 'bg-gradient-to-br from-blue-950/90 via-slate-900 to-cyan-950/90 border border-cyan-500/40 shadow-xl shadow-cyan-950/30 backdrop-blur-xl';
          break;
        case 'SOLID_SLATE':
          base = 'bg-slate-900 border border-slate-800 shadow-xl';
          break;
        case 'NEON_CYAN':
          base = 'bg-cyan-950/50 border border-cyan-400/50 shadow-lg shadow-cyan-500/20 backdrop-blur-xl';
          break;
        default:
          base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
          break;
      }
    } else {
      switch (cardStyle) {
        case 'SOLID':
          base = 'bg-slate-900 border border-slate-800 shadow-xl';
          break;
        case 'NEON':
          base = 'bg-slate-900/90 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 backdrop-blur-xl';
          break;
        case 'FLAT':
          base = 'bg-slate-900/60 border border-slate-700/60 shadow-none';
          break;
        case 'GLASS':
        default:
          base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
          break;
      }
    }

    return base;
  };

  const cardStyleClass = getCardStyleClass();

  const menuModules = [
    {
      id: 'jemaat_portal' as NavTab,
      title: 'Portal Jemaat Saya',
      subtitle: 'KTA Digital, Sakramen, Doa & Persembahan Saya',
      category: 'PELAYANAN MANDIRI',
      icon: UserCheck,
      badge: 'Jemaat Mandatory',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'chat' as NavTab,
      title: 'Ruang Chat Komunitas Jemaat',
      subtitle: 'Obrolan Komunitas, Berbagi Sapaan, Doa & Persekutuan Bersama',
      category: 'KOMUNITAS & CHAT',
      icon: MessageCircle,
      badge: 'Live Chat',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'pustaka' as NavTab,
      title: 'Alkitab & Buku Pujian (KJ, NKB, PKJ, Lagu)',
      subtitle: '66 Kitab Suci Alkitab, Kidung Jemaat, NKB, PKJ & Lagu Kontemporer Berchord',
      category: 'PUSTAKA ROHANI',
      icon: BookMarked,
      badge: 'Alkitab & Lagu',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'jemaat' as NavTab,
      title: 'Data Jemaat & Kartu Keluarga',
      subtitle: 'Database Seluruh Anggota, Sektor & Kepala Keluarga',
      category: 'ADMINISTRASI JEMAAT',
      icon: Users,
      badge: 'Database',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'keuangan' as NavTab,
      title: 'Keuangan & Kas Gereja',
      subtitle: 'Pencatatan Kas, Transfer Bank, QRIS & Laporan Kebendaharaan',
      category: 'KEUANGAN & BENDAHARA',
      icon: DollarSign,
      badge: 'Kas & QRIS',
      roles: ['ADMIN', 'SUPER_ADMIN', 'JEMAAT']
    },
    {
      id: 'administrasi' as NavTab,
      title: 'Surat Sakramen & Akta',
      subtitle: 'Pengurusan Surat Baptis Kudus, Sidi, Pernikahan & Jemaat',
      category: 'SEKRETARIAT',
      icon: FileText,
      badge: 'Arsip Surat',
      roles: ['ADMIN', 'SUPER_ADMIN', 'JEMAAT']
    },
    {
      id: 'jadwal' as NavTab,
      title: 'Jadwal Ibadah Rutin',
      subtitle: 'Jadwal Kebaktian Minggu, Pelayan Ibadah & Pemusik',
      category: 'IBADAH & PELAYANAN',
      icon: Calendar,
      badge: 'Ibadah Minggu',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'agenda' as NavTab,
      title: 'Agenda Events & Reservasi',
      subtitle: 'Jadwal Acara Spesial & Booking Tempat Duduk Ibadah',
      category: 'EVENT & RESERVASI',
      icon: Sparkles,
      badge: 'Booking Seat',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'doa' as NavTab,
      title: 'Permohonan Doa & Syafaat',
      subtitle: 'Kirim Pokok Doa Pribadi & Dukungan Komunitas Doa',
      category: 'PELAYANAN DOA',
      icon: Heart,
      badge: 'Syafaat',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'renungan' as NavTab,
      title: 'Renungan Harian & Audio',
      subtitle: 'Artikel Firman Tuhan & Audio Podcast Renungan Pagi',
      category: 'ROHANI & MEDIA',
      icon: BookOpen,
      badge: 'Audio & Teks',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'pengumuman' as NavTab,
      title: 'Warta & Pengumuman',
      subtitle: 'Informasi Warta Minggu & Pengumuman Resmi Gembala',
      category: 'INFORMASI GEREJA',
      icon: Megaphone,
      badge: 'Warta Minggu',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'galeri' as NavTab,
      title: 'Galeri Foto Kegiatan',
      subtitle: 'Dokumentasi Album Foto Ibadah, Youth & Diakonia',
      category: 'DOKUMENTASI',
      icon: ImageIcon,
      badge: 'Album Foto',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'media' as NavTab,
      title: 'Video & Live Streaming',
      subtitle: 'Rekaman Khotbah, Live Broadcast & Video Youtube',
      category: 'MULTIMEDIA',
      icon: Video,
      badge: 'Live Streaming',
      roles: ['JEMAAT', 'ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'wilayah' as NavTab,
      title: 'Wilayah & Sektor Pelayanan',
      subtitle: 'Pemetaan Sektor Jemaat, Ketua Sektor & Lokasi Ibadah Rumah',
      category: 'ORGANISASI',
      icon: MapPin,
      badge: 'Sektor',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'laporan' as NavTab,
      title: 'Laporan PDF & Excel',
      subtitle: 'Cetak Laporan Keuangan, Jemaat & Statistik Ibadah',
      category: 'LAPORAN SYSTEM',
      icon: FileSpreadsheet,
      badge: 'Export PDF',
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      id: 'settings' as NavTab,
      title: 'Pengaturan System & Visual',
      subtitle: 'Kustomisasi Tema, Logo Gereja, Banner & Hak Akses User',
      category: 'SYSTEM ADMIN',
      icon: Settings,
      badge: 'SuperAdmin',
      roles: ['ADMIN', 'SUPER_ADMIN']
    }
  ];

  const filteredModules = menuModules.filter((m) => m.roles.includes(currentUser.role));

  return (
    <div className="space-y-2.5 sm:space-y-4 md:space-y-6 pb-6 max-w-7xl mx-auto px-1 sm:px-3 animate-fade-in">
      {/* Header Banner */}
      <div className={`p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl ${cardStyleClass} text-white border border-white/10 shadow-2xl relative overflow-hidden space-y-3`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xl shadow-indigo-500/10 shrink-0">
              <Grid className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                Pusat Navigasi Terpadu
              </span>
              <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Menu Utama &amp; Seluruh Modul Pelayanan
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 sm:mt-1">
                Akses cepat ke semua fitur sistem, portal jemaat, jadwal, keuangan &amp; dokumentasi
              </p>
            </div>
          </div>

          <div className="shrink-0 px-3 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{filteredModules.length} Fitur Siap Digunakan</span>
          </div>
        </div>
      </div>

      {/* Grid Menu Utama - Selaras dengan Tema Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
        {filteredModules.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl ${cardStyleClass} hover:border-indigo-500/50 hover:bg-white/10 text-left transition-all duration-200 group cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between space-y-2.5 sm:space-y-4 min-h-[130px] sm:min-h-[160px]`}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500/30 group-hover:text-indigo-300 group-hover:border-indigo-400/50 shadow-md group-hover:scale-105 transition-all">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-extrabold border border-indigo-500/30 uppercase tracking-wider">
                  {item.badge}
                </span>
              </div>

              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                  {item.category}
                </span>
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-snug group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all shrink-0 ml-1.5" />
                </h3>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 font-normal leading-relaxed line-clamp-2">
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
