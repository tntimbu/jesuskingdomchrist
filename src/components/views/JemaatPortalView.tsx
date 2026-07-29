import React, { useState, useEffect } from 'react';
import { User, Jemaat, Persembahan, EventSchedule, Pengumuman, Renungan } from '../../types';
import { StorageManager } from '../../utils/storage';
import { DEFAULT_CHURCH_LOGO } from '../../data/initialData';
import { UserCheck, Heart, Calendar, Megaphone, BookOpen, DollarSign, Download, ShieldCheck } from 'lucide-react';

interface JemaatPortalViewProps {
  currentUser: User;
}

export const JemaatPortalView: React.FC<JemaatPortalViewProps> = ({ currentUser }) => {
  const [jemaatData, setJemaatData] = useState<Jemaat | null>(null);
  const [personalOfferings, setPersonalOfferings] = useState<Persembahan[]>([]);
  const [events, setEvents] = useState<EventSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [devotion, setDevotion] = useState<Renungan | null>(null);

  const loadData = React.useCallback(() => {
    const allJemaat = StorageManager.getJemaat();
    const found = allJemaat.find((j) => j.jemaat_id === currentUser.jemaat_id) || allJemaat[0];
    setJemaatData(found);

    const allPersembahan = StorageManager.getPersembahan();
    setPersonalOfferings(allPersembahan.slice(0, 3));

    setEvents(StorageManager.getEvents());
    setAnnouncements(StorageManager.getPengumuman());
    const dev = StorageManager.getRenungan();
    setDevotion(dev[0] || null);
  }, [currentUser]);

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    const intervalId = setInterval(loadData, 1500);

    return () => {
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(intervalId);
    };
  }, [loadData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <img
            src={jemaatData?.foto || DEFAULT_CHURCH_LOGO}
            alt="Foto Profil"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
            }}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-lg"
          />
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
              Portal Anggota Jemaat Terverifikasi
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Shalom, {jemaatData?.nama_lengkap || currentUser.nama}
            </h2>
            <p className="text-xs text-slate-400">
              ID Jemaat: <strong className="text-indigo-300">{jemaatData?.jemaat_id}</strong> • Wilayah: {jemaatData?.wilayah}
            </p>
          </div>
        </div>
      </div>

      {/* Member Profile Details Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm text-white space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          <span>Informasi Keanggotaan & Kartu Jemaat</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1">NIK KTP & KK:</span>
            <p className="font-mono text-slate-200 font-bold">{jemaatData?.nik}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">KK: {jemaatData?.no_kk}</p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Status Sacraments:</span>
            <p className="text-emerald-400 font-bold">Baptis: {jemaatData?.status_baptis}</p>
            <p className="text-blue-400 font-bold">Sidi: {jemaatData?.status_sidi}</p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Komisi & Pelayanan:</span>
            <p className="text-indigo-300 font-bold">{jemaatData?.komisi}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Status: {jemaatData?.status}</p>
          </div>
        </div>
      </div>

      {/* Devotion of the day */}
      {devotion && (
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-800/40 p-6 text-white space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Santapan Rohani Hari Ini ({devotion.tanggal})</span>
          </div>
          <h3 className="text-lg font-bold">{devotion.judul}</h3>
          <span className="inline-block px-3 py-1 rounded-xl bg-indigo-900/60 text-indigo-200 text-xs font-semibold">
            {devotion.ayat_alkitab}
          </span>
          <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
            "{devotion.isi}"
          </p>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm text-white space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span>Jadwal Ibadah Minggu Ini</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {events.slice(0, 2).map((evt) => (
            <div key={evt.event_id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                {evt.kategori}
              </span>
              <h4 className="font-bold text-white text-sm mt-1">{evt.nama}</h4>
              <p className="text-slate-400">{evt.tanggal} • {evt.jam}</p>
              <p className="text-slate-400">{evt.lokasi} • Pembicara: {evt.pembicara}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
