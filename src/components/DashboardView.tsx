import React, { useEffect, useState } from 'react';
import { User, AppSettings, Jemaat, Persembahan, EventSchedule, ActivityLog } from '../types';
import { StorageManager } from '../utils/storage';
import {
  Users,
  DollarSign,
  Calendar,
  Activity,
  PlusCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Megaphone,
  Download,
  Building2,
  HeartHandshake
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  currentUser: User;
  settings: AppSettings;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, settings, onNavigate }) => {
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [persembahanList, setPersembahanList] = useState<Persembahan[]>([]);
  const [eventsList, setEventsList] = useState<EventSchedule[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    setJemaatList(StorageManager.getJemaat());
    setPersembahanList(StorageManager.getPersembahan());
    setEventsList(StorageManager.getEvents());
    setActivityLogs(StorageManager.getActivityLogs());
  }, []);

  const totalJemaat = jemaatList.length;
  const totalLaki = jemaatList.filter((j) => j.jenis_kelamin === 'Laki-laki').length;
  const totalPerempuan = jemaatList.filter((j) => j.jenis_kelamin === 'Perempuan').length;
  const totalPersembahan = persembahanList.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const totalKeluarga = StorageManager.getKeluarga().length;

  // Chart Data: Financial trend
  const financialChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Juli'],
    datasets: [
      {
        fill: true,
        label: 'Persembahan Minggu & Perpuluhan (Rp)',
        data: [42000000, 48500000, 51000000, 62000000, 58000000, 71000000, totalPersembahan],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.4
      }
    ]
  };

  const financialChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `Rp ${context.raw.toLocaleString('id-ID')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
    }
  };

  // Doughnut Chart Data: Wilayah Distribution
  const wilayahCount: { [key: string]: number } = {};
  jemaatList.forEach((j) => {
    const w = j.wilayah || 'Lainnya';
    wilayahCount[w] = (wilayahCount[w] || 0) + 1;
  });

  const wilayahChartData = {
    labels: Object.keys(wilayahCount),
    datasets: [
      {
        data: Object.values(wilayahCount),
        backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Card Banner - Glassmorphism */}
      <div className="relative rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  currentUser.jemaat_id
                    ? jemaatList.find((j) => j.jemaat_id === currentUser.jemaat_id)?.foto ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1548625361-185966347898?w=200&auto=format&fit=crop&q=80'
                }
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#0f172a]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Role: {currentUser.role}
                </span>
                <span className="text-xs text-slate-400">Aktif Realtime</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white">
                Shalom, {currentUser.nama}!
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Selamat datang di sistem manajemen {settings.nama_gereja}.
              </p>
            </div>
          </div>

          {/* Quick Access Actions Header */}
          <div className="flex flex-wrap items-center gap-2">
            {currentUser.role !== 'JEMAAT' && (
              <>
                <button
                  onClick={() => onNavigate('jemaat')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Jemaat</span>
                </button>
                <button
                  onClick={() => onNavigate('keuangan')}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Input Persembahan</span>
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('laporan')}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jemaat Card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-lg hover:border-white/20 transition-all text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Jemaat</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight">{totalJemaat} <span className="text-xs text-slate-400 font-normal">Jiwa</span></h3>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-3 border-t border-white/10 pt-2">
            <span>L: {totalLaki} Jiwa</span>
            <span>•</span>
            <span>P: {totalPerempuan} Jiwa</span>
          </div>
        </div>

        {/* Total Keluarga Card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-lg hover:border-white/20 transition-all text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kepala Keluarga</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight">{totalKeluarga} <span className="text-xs text-slate-400 font-normal">KK</span></h3>
            <span className="text-xs font-medium text-slate-400">4 Wilayah</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-white/10 pt-2">
            Terdaftar di Database Gereja
          </div>
        </div>

        {/* Total Persembahan Card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-lg hover:border-white/20 transition-all text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Persembahan Bulan Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-xl font-bold tracking-tight text-emerald-400">
              Rp {totalPersembahan.toLocaleString('id-ID')}
            </h3>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-white/10 pt-2 flex items-center justify-between">
            <span>Tersimpan di Kas</span>
            <span className="text-emerald-400 font-semibold">Tercatat</span>
          </div>
        </div>

        {/* Event Mendatang Card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-lg hover:border-white/20 transition-all text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jadwal & Event</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight">{eventsList.length} <span className="text-xs text-slate-400 font-normal">Agenda</span></h3>
            <span className="text-xs font-medium text-amber-400">Minggu Ini</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-white/10 pt-2 truncate">
            {eventsList[0]?.nama || 'Ibadah Raya Minggu'}
          </div>
        </div>
      </div>

      {/* Charts Section: Line & Doughnut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Growth Chart */}
        <div className="lg:col-span-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Grafik Tren Persembahan & Kas</h3>
              <p className="text-xs text-slate-400">Statistik akumulasi penerimaan per bulan tahun 2026</p>
            </div>
            <button
              onClick={() => onNavigate('keuangan')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Lihat Detail Kas</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 w-full">
            <Line data={financialChartData} options={financialChartOptions} />
          </div>
        </div>

        {/* Wilayah Distribution Chart */}
        <div className="lg:col-span-4 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl text-white flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Demografi Per Wilayah</h3>
            <p className="text-xs text-slate-400 mb-4">Sebaran lokasi tempat tinggal jemaat</p>
            <div className="h-48 w-full flex items-center justify-center">
              <Doughnut
                data={wilayahChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 10 } } } }
                }}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-white/10 text-center">
            <button
              onClick={() => onNavigate('wilayah')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Kelola Data Wilayah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Today's Schedule & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold">Jadwal Ibadah & Agenda Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Semua Agenda
            </button>
          </div>

          <div className="space-y-3">
            {eventsList.slice(0, 3).map((evt) => (
              <div
                key={evt.event_id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs hover:border-indigo-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                      {evt.kategori || 'Ibadah'}
                    </span>
                    <span className="text-slate-400 text-[11px]">{evt.jam}</span>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm mt-1">{evt.nama}</h4>
                  <p className="text-slate-400 mt-0.5">{evt.lokasi} • Pembicara: {evt.pembicara || '-'}</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                  {evt.tanggal}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Logs & Audit Feed */}
        <div className="lg:col-span-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold">Aktivitas System Terbaru</h3>
            </div>
            {currentUser.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Audit Log
              </button>
            )}
          </div>

          <div className="space-y-3">
            {activityLogs.slice(0, 4).map((log) => (
              <div
                key={log.log_id}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-300">{log.user}</span>
                    <span className="text-[10px] text-slate-500">• {log.module || 'System'}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-1">{log.aktivitas}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{log.tanggal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
