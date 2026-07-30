import React, { useState, useEffect } from 'react';
import { EventSchedule, EventReservation, Doa, User } from '../../types';
import { StorageManager } from '../../utils/storage';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Heart,
  CheckCircle2,
  MessageSquare,
  X,
  Trash2,
  Sparkles,
  Ticket,
  Users,
  Check,
  Search,
  Phone,
  Send,
  AlertCircle,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';

interface AgendaViewProps {
  currentUser: User;
  mode?: 'JADWAL' | 'AGENDA' | 'DOA' | 'BOTH';
}

export const AgendaView: React.FC<AgendaViewProps> = ({ currentUser, mode = 'BOTH' }) => {
  const [activeTab, setActiveTab] = useState<'JADWAL' | 'UPCOMING_EVENTS' | 'DOA'>(
    mode === 'DOA' ? 'DOA' : mode === 'AGENDA' ? 'UPCOMING_EVENTS' : 'JADWAL'
  );

  const [eventsList, setEventsList] = useState<EventSchedule[]>([]);
  const [reservationsList, setReservationsList] = useState<EventReservation[]>([]);
  const [doaList, setDoaList] = useState<Doa[]>([]);

  useEffect(() => {
    if (mode === 'DOA') setActiveTab('DOA');
    else if (mode === 'AGENDA') setActiveTab('UPCOMING_EVENTS');
    else if (mode === 'JADWAL') setActiveTab('JADWAL');
  }, [mode]);

  // Modals State
  const [isEventModal, setIsEventModal] = useState(false);
  const [isDoaModal, setIsDoaModal] = useState(false);

  // Reservation Modal for Jemaat
  const [selectedEventForReservation, setSelectedEventForReservation] = useState<EventSchedule | null>(null);
  const [resName, setResName] = useState(currentUser.nama || '');
  const [resWa, setResWa] = useState(currentUser.no_hp || '');
  const [resSeats, setResSeats] = useState(1);
  const [resNotes, setResNotes] = useState('');
  const [resSuccess, setResSuccess] = useState('');

  // Admin View Reservations Modal
  const [selectedEventForAdmin, setSelectedEventForAdmin] = useState<EventSchedule | null>(null);
  const [isAllAdminReservationsModal, setIsAllAdminReservationsModal] = useState(false);
  const [reservationSearch, setReservationSearch] = useState('');

  const isMatchingEvent = (rEventId?: string, targetEventId?: string) => {
    if (!rEventId || !targetEventId) return false;
    const r = rEventId.trim().toLowerCase();
    const t = targetEventId.trim().toLowerCase();
    return (
      r === t ||
      r.replace('evt-2026-', 'evt-') === t.replace('evt-2026-', 'evt-') ||
      t.replace('evt-2026-', 'evt-') === r.replace('evt-2026-', 'evt-')
    );
  };

  // Forms
  const [eventForm, setEventForm] = useState({
    nama: '',
    kategori: 'Upcoming Special Event',
    tanggal: new Date().toISOString().slice(0, 10),
    jam: '09:00 - 12:00 WIB',
    lokasi: 'Sanctuary Main Hall GKFC Pro',
    pembicara: 'Pdt. Dr. Herman Setyawan, M.Th',
    keterangan: 'Kebaktian KKR & Persekutuan Spesial',
    kuota_kursi: 150
  });

  const [doaForm, setDoaForm] = useState({
    nama_pemohon: currentUser.nama || '',
    kategori: 'Kesehatan & Kesembuhan',
    isi_permohonan: ''
  });

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    const unsubscribe = StorageManager.subscribe(handleSync);
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    const intervalId = setInterval(loadData, 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(intervalId);
    };
  }, []);

  const loadData = () => {
    setEventsList(StorageManager.getEvents());
    setReservationsList(StorageManager.getEventReservations());
    setDoaList(StorageManager.getDoa());
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.nama) return;

    const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.random().toString(36).substring(2, 5)}`;
    const newE: EventSchedule = {
      event_id: `EVT-2026-${uniqueSuffix}`,
      nama: eventForm.nama,
      kategori: eventForm.kategori,
      tanggal: eventForm.tanggal,
      jam: eventForm.jam,
      lokasi: eventForm.lokasi,
      pembicara: eventForm.pembicara,
      keterangan: eventForm.keterangan,
      kuota_kursi: Number(eventForm.kuota_kursi) || 150
    };

    const updated = [newE, ...eventsList];
    setEventsList(updated);
    StorageManager.saveEvents(updated);
    StorageManager.logActivity(currentUser.username, `Membuat event baru: ${newE.nama}`, 'Jadwal & Event');
    setIsEventModal(false);
  };

  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForReservation || !resName || !resWa) return;

    const newRes: EventReservation = {
      reservation_id: `RES-2026-${Date.now().toString().slice(-4)}`,
      event_id: selectedEventForReservation.event_id,
      nama_jemaat: resName,
      nomor_wa: resWa,
      jumlah_kursi: Number(resSeats) || 1,
      catatan: resNotes,
      tanggal_reservasi: new Date().toLocaleString('id-ID'),
      status: 'TERKONFIRMASI'
    };

    const updated = [newRes, ...reservationsList];
    setReservationsList(updated);
    StorageManager.saveEventReservations(updated);
    StorageManager.logActivity(currentUser.username, `Melakukan reservasi event "${selectedEventForReservation.nama}" sebanyak ${resSeats} kursi`, 'Events');

    setResSuccess(`✅ Reservasi berhasil! ${resSeats} kursi terkonfirmasi.`);
    setTimeout(() => {
      setResSuccess('');
      setSelectedEventForReservation(null);
    }, 2000);
  };

  const handleUpdateReservationStatus = (id: string, newStatus: 'TERKONFIRMASI' | 'MENUNGGU' | 'DIBATALKAN') => {
    const updated = reservationsList.map((r) => (r.reservation_id === id ? { ...r, status: newStatus } : r));
    setReservationsList(updated);
    StorageManager.saveEventReservations(updated);
  };

  const handleDeleteReservation = (id: string) => {
    if (window.confirm('Hapus data reservasi ini?')) {
      const updated = reservationsList.filter((r) => r.reservation_id !== id);
      setReservationsList(updated);
      StorageManager.saveEventReservations(updated);
    }
  };

  const handleSaveDoa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doaForm.isi_permohonan) return;

    const newD: Doa = {
      doa_id: `DOA-2026-${(doaList.length + 1).toString().padStart(3, '0')}`,
      nama_pemohon: doaForm.nama_pemohon,
      kategori: doaForm.kategori,
      isi_permohonan: doaForm.isi_permohonan,
      tanggal: new Date().toISOString().slice(0, 10),
      status: 'Proses Doa'
    };

    const updated = [newD, ...doaList];
    setDoaList(updated);
    StorageManager.saveDoa(updated);
    StorageManager.logActivity(currentUser.username, `Mengirimkan permohonan doa: ${newD.kategori}`, 'Permohonan Doa');
    setIsDoaModal(false);
  };

  const handleUpdateStatusDoa = (id: string, newStatus: string) => {
    const updated = doaList.map((d) => (d.doa_id === id ? { ...d, status: newStatus as any } : d));
    setDoaList(updated);
    StorageManager.saveDoa(updated);
  };

  const handleDeleteEvent = (id: string, nama: string) => {
    if (window.confirm(`Hapus event "${nama}"?`)) {
      const updated = eventsList.filter((e) => e.event_id !== id);
      setEventsList(updated);
      StorageManager.saveEvents(updated);
      StorageManager.logActivity(currentUser.username, `Menghapus event: ${nama}`, 'Jadwal & Event');
    }
  };

  const handleDeleteDoa = (id: string) => {
    if (window.confirm('Hapus permohonan doa ini?')) {
      const updated = doaList.filter((d) => d.doa_id !== id);
      setDoaList(updated);
      StorageManager.saveDoa(updated);
      StorageManager.logActivity(currentUser.username, `Menghapus doa ID: ${id}`, 'Permohonan Doa');
    }
  };

  // Separate lists
  const isRutinCategory = (cat?: string) => {
    if (!cat) return true;
    const lower = cat.toLowerCase();
    return lower.includes('ibadah') || lower.includes('rutin') || lower.includes('minggu') || lower.includes('komsel');
  };

  const jadwalRutinList = eventsList.filter((e) => isRutinCategory(e.kategori));
  const upcomingEventsList = eventsList.filter((e) => !isRutinCategory(e.kategori) || e.kategori?.includes('Event') || e.kategori?.includes('KKR') || e.kategori?.includes('Special'));

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {mode === 'DOA' ? (
              <>
                <Heart className="w-6 h-6 text-rose-400" />
                <span>Permohonan Doa Jemaat</span>
              </>
            ) : mode === 'AGENDA' ? (
              <>
                <Sparkles className="w-6 h-6 text-amber-400" />
                <span>Upcoming Events &amp; Reservasi Kursi</span>
              </>
            ) : (
              <>
                <CalendarDays className="w-6 h-6 text-indigo-400" />
                <span>Jadwal Ibadah Rutin Gereja</span>
              </>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {mode === 'DOA'
              ? 'Layanan permohonan doa syafaat, konseling rohani, dan dukungan doa persekutuan jemaat.'
              : mode === 'AGENDA'
              ? 'Agenda kegiatan spesial, KKR, retret, dan reservasi kehadiran jemaat terhubung langsung ke Admin.'
              : 'Kalender resmi jadwal ibadah raya mingguan, persekutuan komsel, dan pelayanan gereja.'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0 flex-wrap">
          <button
            onClick={() => setActiveTab('JADWAL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'JADWAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Ibadah Rutin ({jadwalRutinList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('UPCOMING_EVENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'UPCOMING_EVENTS' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upcoming Events ({upcomingEventsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DOA')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'DOA' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Permohonan Doa ({doaList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: JADWAL IBADAH RUTIN */}
      {activeTab === 'JADWAL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span>Jadwal Ibadah Rutin &amp; Persekutuan Komsel</span>
            </h3>
            {currentUser.role !== 'JEMAAT' && (
              <button
                onClick={() => {
                  setEventForm((prev) => ({ ...prev, kategori: 'Ibadah Raya' }));
                  setIsEventModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Jadwal Ibadah</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(jadwalRutinList.length > 0 ? jadwalRutinList : eventsList).map((e, idx) => (
              <div
                key={`rutin-${e.event_id || 'evt'}-${idx}`}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white hover:border-indigo-500/40 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                      {e.kategori || 'Ibadah Rutin'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{e.tanggal}</span>
                      {currentUser.role !== 'JEMAAT' && (
                        <button
                          onClick={() => handleDeleteEvent(e.event_id, e.nama)}
                          className="p-1.5 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 transition-all text-[11px] cursor-pointer"
                          title="Hapus Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-white leading-snug">{e.nama}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{e.jam}</span>
                  </p>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{e.lokasi}</span>
                  </p>
                  {e.pembicara && (
                    <p className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                      Pelayan Firman / Musisi: <strong className="text-slate-200">{e.pembicara}</strong>
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {e.keterangan || 'Hadir dan nikmati lawatan Tuhan.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: UPCOMING EVENTS & RESERVASI */}
      {activeTab === 'UPCOMING_EVENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Upcoming Special Events &amp; Reservasi Tempat</span>
            </h3>
            {currentUser.role !== 'JEMAAT' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAllAdminReservationsModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>Rekap Semua Reservasi Jemaat ({reservationsList.length})</span>
                </button>
                <button
                  onClick={() => {
                    setEventForm((prev) => ({ ...prev, kategori: 'Upcoming Event Spesial' }));
                    setIsEventModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Upcoming Event</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(upcomingEventsList.length > 0 ? upcomingEventsList : eventsList).map((e, idx) => {
              const eventResList = reservationsList.filter((r) => isMatchingEvent(r.event_id, e.event_id) && r.status !== 'DIBATALKAN');
              const totalBookedSeats = eventResList.reduce((acc, curr) => acc + curr.jumlah_kursi, 0);
              const maxSeats = e.kuota_kursi || 150;
              const remainingSeats = Math.max(0, maxSeats - totalBookedSeats);

              // Check if user has already reserved
              const userRes = reservationsList.find((r) => isMatchingEvent(r.event_id, e.event_id) && (r.nama_jemaat || '').toLowerCase() === (currentUser.nama || '').toLowerCase());

              return (
                <div
                  key={`upcoming-${e.event_id || 'evt'}-${idx}`}
                  className="rounded-3xl bg-slate-900 border-2 border-amber-500/30 p-5 shadow-xl text-white hover:border-amber-500/70 transition-all space-y-4 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                        {e.kategori || 'Special Event'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-amber-300 font-bold">{e.tanggal}</span>
                        {currentUser.role !== 'JEMAAT' && (
                          <button
                            onClick={() => handleDeleteEvent(e.event_id, e.nama)}
                            className="p-1 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 transition-all cursor-pointer"
                            title="Hapus Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="text-lg font-black text-white leading-snug">{e.nama}</h4>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{e.jam}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{e.lokasi}</span>
                      </p>
                      {e.pembicara && (
                        <p className="text-slate-300 font-medium">
                          Pembicara: <strong className="text-white">{e.pembicara}</strong>
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      {e.keterangan || 'Persiapkan hati Anda untuk menghadiri acara ini.'}
                    </p>

                    {/* Kuota Seats Info */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <Ticket className="w-4 h-4 text-amber-400" />
                          <span>Status Kuota Kursi:</span>
                        </span>
                        <span className={remainingSeats > 0 ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}>
                          {remainingSeats > 0 ? `${remainingSeats} Kursi Tersedia` : 'Penuh'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (totalBookedSeats / maxSeats) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Terisi: {totalBookedSeats} kursi</span>
                        <span>Total Kuota: {maxSeats} kursi</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {userRes && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Anda telah reservasi ({userRes.jumlah_kursi} kursi)</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedEventForReservation(e)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Reservasi Kursi</span>
                      </button>

                      {currentUser.role !== 'JEMAAT' && (
                        <button
                          onClick={() => setSelectedEventForAdmin(e)}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-indigo-400" />
                          <span>Daftar Pemesan ({eventResList.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PERMOHONAN DOA */}
      {activeTab === 'DOA' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Daftar Permohonan Doa Jemaat</span>
            </h3>
            <button
              onClick={() => setIsDoaModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Kirim Pokok Doa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doaList.map((d, idx) => (
              <div
                key={`doa-${d.doa_id || 'doa'}-${idx}`}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white hover:border-rose-500/40 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-bold">
                      {d.kategori}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{d.tanggal}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>{d.nama_pemohon}</span>
                  </h4>

                  <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 leading-relaxed italic">
                    "{d.isi_permohonan}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                    d.status === 'Selesai Doa' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {d.status || 'Proses Doa'}
                  </span>

                  {currentUser.role !== 'JEMAAT' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateStatusDoa(d.doa_id, 'Selesai Doa')}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Selesai Doa
                      </button>
                      <button
                        onClick={() => handleDeleteDoa(d.doa_id)}
                        className="p-1 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 cursor-pointer"
                        title="Hapus Doa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: RESERVASI KURSI JEMAAT */}
      {selectedEventForReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl p-6 text-white space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Formulir Reservasi Kursi / Kehadiran Event</h3>
              </div>
              <button
                onClick={() => setSelectedEventForReservation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <h4 className="font-extrabold text-amber-300 text-sm">{selectedEventForReservation.nama}</h4>
              <p className="text-slate-300">Waktu: {selectedEventForReservation.tanggal} &bull; {selectedEventForReservation.jam}</p>
              <p className="text-slate-300">Lokasi: {selectedEventForReservation.lokasi}</p>
            </div>

            {resSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <span>{resSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveReservation} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Nama Pemesan / Jemaat:</label>
                <input
                  type="text"
                  required
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Nomor WhatsApp / HP Active:</label>
                  <input
                    type="text"
                    required
                    value={resWa}
                    onChange={(e) => setResWa(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">Jumlah Tempat / Kursi:</label>
                  <select
                    value={resSeats}
                    onChange={(e) => setResSeats(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} Kursi / Orang
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Catatan Tambahan (Opsional):</label>
                <input
                  type="text"
                  value={resNotes}
                  onChange={(e) => setResNotes(e.target.value)}
                  placeholder="Contoh: Membawa anak-anak / lansia / rombongan komsel"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEventForReservation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Konfirmasi Reservasi Kursi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADMIN VIEW RESERVATIONS LIST */}
      {selectedEventForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Daftar Reservasi Kursi Jemaat</span>
                </h3>
                <p className="text-xs text-indigo-300 font-bold mt-0.5">{selectedEventForAdmin.nama}</p>
              </div>
              <button
                onClick={() => setSelectedEventForAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {reservationsList.filter((r) => isMatchingEvent(r.event_id, selectedEventForAdmin.event_id)).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Belum ada jemaat yang melakukan reservasi untuk event ini.</div>
              ) : (
                reservationsList
                  .filter((r) => isMatchingEvent(r.event_id, selectedEventForAdmin.event_id))
                  .map((r) => (
                    <div key={r.reservation_id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">{r.nama_jemaat}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'TERKONFIRMASI' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300 text-[11px]">
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WA: {r.nomor_wa}</span>
                        </p>
                        <p className="flex items-center gap-1 font-bold text-amber-300">
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{r.jumlah_kursi} Kursi</span>
                        </p>
                        <p className="text-slate-400 text-[10px]">{r.tanggal_reservasi}</p>
                      </div>
                      {r.catatan && <p className="text-[11px] text-slate-400 italic">Catatan: "{r.catatan}"</p>}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                        <button
                          onClick={() => handleUpdateReservationStatus(r.reservation_id, 'TERKONFIRMASI')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Konfirmasi
                        </button>
                        <button
                          onClick={() => handleUpdateReservationStatus(r.reservation_id, 'DIBATALKAN')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          Batalkan
                        </button>
                        <button
                          onClick={() => handleDeleteReservation(r.reservation_id)}
                          className="p-1 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2B: ADMIN REKAP SEMUA RESERVASI JEMAAT */}
      {isAllAdminReservationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Panel Admin: Rekap Seluruh Reservasi Kursi Jemaat</span>
                </h3>
                <p className="text-xs text-indigo-300 font-bold mt-0.5">
                  Total {reservationsList.length} Order Reservasi ({reservationsList.reduce((acc, curr) => acc + curr.jumlah_kursi, 0)} Total Kursi Dipesan)
                </p>
              </div>
              <button
                onClick={() => setIsAllAdminReservationsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={reservationSearch}
                onChange={(e) => setReservationSearch(e.target.value)}
                placeholder="Cari nama jemaat, nomor WA, atau event..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {reservationsList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Belum ada data reservasi kursi jemaat.</div>
              ) : (
                reservationsList
                  .filter((r) => {
                    if (!reservationSearch) return true;
                    const q = reservationSearch.toLowerCase();
                    const evtName = eventsList.find((e) => isMatchingEvent(e.event_id, r.event_id))?.nama || '';
                    return (
                      r.nama_jemaat.toLowerCase().includes(q) ||
                      r.nomor_wa.includes(q) ||
                      evtName.toLowerCase().includes(q) ||
                      r.status.toLowerCase().includes(q)
                    );
                  })
                  .map((r) => {
                    const matchedEvent = eventsList.find((e) => isMatchingEvent(e.event_id, r.event_id));
                    return (
                      <div key={r.reservation_id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-extrabold text-white text-sm block">{r.nama_jemaat}</span>
                            <span className="text-[11px] text-amber-300 font-semibold block">
                              Event: {matchedEvent?.nama || `ID: ${r.event_id}`}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'TERKONFIRMASI' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300 text-[11px]">
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WA: {r.nomor_wa}</span>
                            <a
                              href={`https://wa.me/${r.nomor_wa.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-400 underline font-bold ml-1 hover:text-emerald-300"
                            >
                              Chat WA
                            </a>
                          </p>
                          <p className="flex items-center gap-1 font-bold text-amber-300">
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{r.jumlah_kursi} Kursi Dipesan</span>
                          </p>
                          <p className="text-slate-400 text-[10px]">{r.tanggal_reservasi}</p>
                        </div>

                        {r.catatan && <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg">Catatan: "{r.catatan}"</p>}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                          <button
                            onClick={() => handleUpdateReservationStatus(r.reservation_id, 'TERKONFIRMASI')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Konfirmasi
                          </button>
                          <button
                            onClick={() => handleUpdateReservationStatus(r.reservation_id, 'DIBATALKAN')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                          >
                            Batalkan
                          </button>
                          <button
                            onClick={() => handleDeleteReservation(r.reservation_id)}
                            className="p-1 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH EVENT BARU */}
      {isEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Tambah Jadwal Ibadah / Event Baru</h3>
              <button onClick={() => setIsEventModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Acara / Event:</label>
                <input
                  type="text"
                  required
                  value={eventForm.nama}
                  onChange={(e) => setEventForm({ ...eventForm, nama: e.target.value })}
                  placeholder="Contoh: Kebaktian KKR Paskah / Ibadah Raya 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Event:</label>
                  <select
                    value={eventForm.kategori}
                    onChange={(e) => setEventForm({ ...eventForm, kategori: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    <option value="Ibadah Raya">Ibadah Raya</option>
                    <option value="Upcoming Event Spesial">Upcoming Event Spesial</option>
                    <option value="Persekutuan Komsel">Persekutuan Komsel</option>
                    <option value="Youth & Pemuda">Youth &amp; Pemuda</option>
                    <option value="Seminar & Retret">Seminar &amp; Retret</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kuota Tempat / Kursi:</label>
                  <input
                    type="number"
                    value={eventForm.kuota_kursi}
                    onChange={(e) => setEventForm({ ...eventForm, kuota_kursi: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Acara:</label>
                  <input
                    type="date"
                    required
                    value={eventForm.tanggal}
                    onChange={(e) => setEventForm({ ...eventForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jam Pelaksanaan:</label>
                  <input
                    type="text"
                    required
                    value={eventForm.jam}
                    onChange={(e) => setEventForm({ ...eventForm, jam: e.target.value })}
                    placeholder="09:00 - 11:30 WIB"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lokasi Gedung / Hall:</label>
                <input
                  type="text"
                  required
                  value={eventForm.lokasi}
                  onChange={(e) => setEventForm({ ...eventForm, lokasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pembicara / Pengkhotbah:</label>
                <input
                  type="text"
                  value={eventForm.pembicara}
                  onChange={(e) => setEventForm({ ...eventForm, pembicara: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Keterangan Tambahan:</label>
                <input
                  type="text"
                  value={eventForm.keterangan}
                  onChange={(e) => setEventForm({ ...eventForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Simpan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: KIRIM DOA */}
      {isDoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <span>Kirim Permohonan Doa Jemaat</span>
              </h3>
              <button onClick={() => setIsDoaModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoa} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Pemohon Doa:</label>
                <input
                  type="text"
                  required
                  value={doaForm.nama_pemohon}
                  onChange={(e) => setDoaForm({ ...doaForm, nama_pemohon: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kategori Doa:</label>
                <select
                  value={doaForm.kategori}
                  onChange={(e) => setDoaForm({ ...doaForm, kategori: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                >
                  <option value="Kesehatan & Kesembuhan">Kesehatan &amp; Kesembuhan</option>
                  <option value="Pemulihan Ekonomi & Pekerjaan">Pemulihan Ekonomi &amp; Pekerjaan</option>
                  <option value="Keharmonisan Keluarga">Keharmonisan Keluarga</option>
                  <option value="Pertumbuhan Rohani">Pertumbuhan Rohani</option>
                  <option value="Pokok Doa Umum">Pokok Doa Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Isi Permohonan Doa:</label>
                <textarea
                  required
                  rows={4}
                  value={doaForm.isi_permohonan}
                  onChange={(e) => setDoaForm({ ...doaForm, isi_permohonan: e.target.value })}
                  placeholder="Tuliskan permohonan doa Anda secara rinci..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDoaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Permohonan Doa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
