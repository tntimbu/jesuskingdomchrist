import React, { useState, useEffect } from 'react';
import { EventSchedule, Doa, User } from '../../types';
import { StorageManager } from '../../utils/storage';
import { CalendarDays, Plus, Clock, MapPin, Heart, CheckCircle2, MessageSquare, X } from 'lucide-react';

interface AgendaViewProps {
  currentUser: User;
  mode?: 'JADWAL' | 'DOA' | 'BOTH';
}

export const AgendaView: React.FC<AgendaViewProps> = ({ currentUser, mode = 'BOTH' }) => {
  const [activeTab, setActiveTab] = useState<'AGENDA' | 'DOA'>(mode === 'DOA' ? 'DOA' : 'AGENDA');
  const [eventsList, setEventsList] = useState<EventSchedule[]>([]);
  const [doaList, setDoaList] = useState<Doa[]>([]);

  useEffect(() => {
    if (mode === 'DOA') setActiveTab('DOA');
    else if (mode === 'JADWAL') setActiveTab('AGENDA');
  }, [mode]);

  // Modals
  const [isEventModal, setIsEventModal] = useState(false);
  const [isDoaModal, setIsDoaModal] = useState(false);

  // Forms
  const [eventForm, setEventForm] = useState({
    nama: '',
    kategori: 'Ibadah Raya',
    tanggal: new Date().toISOString().slice(0, 10),
    jam: '09:00 - 11:30 WIB',
    lokasi: 'Sanctuary Main Hall GKFC Pro',
    pembicara: 'Pdt. Dr. Herman Setyawan, M.Th',
    keterangan: 'Ibadah Ucapan Syukur & Perjamuan Kudus'
  });

  const [doaForm, setDoaForm] = useState({
    nama_pemohon: currentUser.nama || '',
    kategori: 'Kesehatan & Kesembuhan',
    isi_permohonan: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEventsList(StorageManager.getEvents());
    setDoaList(StorageManager.getDoa());
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.nama) return;

    const newE: EventSchedule = {
      event_id: `EVT-2026-${(eventsList.length + 1).toString().padStart(3, '0')}`,
      nama: eventForm.nama,
      kategori: eventForm.kategori,
      tanggal: eventForm.tanggal,
      jam: eventForm.jam,
      lokasi: eventForm.lokasi,
      pembicara: eventForm.pembicara,
      keterangan: eventForm.keterangan
    };

    const updated = [newE, ...eventsList];
    setEventsList(updated);
    StorageManager.saveEvents(updated);
    StorageManager.logActivity(currentUser.username, `Membuat agenda baru: ${newE.nama}`, 'Jadwal & Doa');
    setIsEventModal(false);
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
    StorageManager.logActivity(currentUser.username, `Mengirimkan permohonan doa: ${newD.kategori}`, 'Jadwal & Doa');
    setIsDoaModal(false);
  };

  const handleUpdateStatusDoa = (id: string, newStatus: string) => {
    const updated = doaList.map((d) => (d.doa_id === id ? { ...d, status: newStatus as any } : d));
    setDoaList(updated);
    StorageManager.saveDoa(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {mode === 'DOA' ? (
              <>
                <Heart className="w-6 h-6 text-rose-400" />
                <span>Permohonan Doa Jemaat</span>
              </>
            ) : mode === 'JADWAL' ? (
              <>
                <CalendarDays className="w-6 h-6 text-amber-400" />
                <span>Jadwal & Event Ibadah Gereja</span>
              </>
            ) : (
              <>
                <CalendarDays className="w-6 h-6 text-amber-400" />
                <span>Jadwal Ibadah, Event & Pokok Doa</span>
              </>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {mode === 'DOA'
              ? 'Layanan permohonan doa syafaat, konseling rohani, dan dukungan doa persekutuan jemaat.'
              : mode === 'JADWAL'
              ? 'Kalender resmi jadwal ibadah raya, persekutuan komsel, dan agenda kegiatan gereja.'
              : 'Kalender kegiatan gereja, pelayan ibadah, permohonan doa jemaat, dan dukungan komsel.'}
          </p>
        </div>

        {mode === 'BOTH' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('AGENDA')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'AGENDA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Jadwal & Agenda ({eventsList.length})
              </button>
              <button
                onClick={() => setActiveTab('DOA')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'DOA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Permohonan Doa ({doaList.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Agenda */}
      {activeTab === 'AGENDA' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kalender Ibadah & Kegiatan</h3>
            {currentUser.role !== 'JEMAAT' && (
              <button
                onClick={() => setIsEventModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Event / Ibadah</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsList.map((e) => (
              <div
                key={e.event_id}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white hover:border-amber-500/40 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                      {e.kategori}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{e.tanggal}</span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-snug">{e.nama}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{e.jam}</span>
                  </p>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{e.lokasi}</span>
                  </p>
                  {e.pembicara && (
                    <p className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                      Pembicara / Pelayan: <strong className="text-slate-200">{e.pembicara}</strong>
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {e.keterangan || 'Tidak ada catatan tambahan.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Permohonan Doa */}
      {activeTab === 'DOA' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kotak Permohonan Doa Jemaat</h3>
            <button
              onClick={() => setIsDoaModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Kirim Permohonan Doa</span>
            </button>
          </div>

          <div className="space-y-3">
            {doaList.map((d) => (
              <div
                key={d.doa_id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-2 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-indigo-300">{d.nama_pemohon}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                      {d.kategori}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{d.tanggal}</span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  "{d.isi_permohonan}"
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    d.status === 'Dijawab' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Status: {d.status}</span>
                  </span>

                  {currentUser.role !== 'JEMAAT' && d.status !== 'Dijawab' && (
                    <button
                      onClick={() => handleUpdateStatusDoa(d.doa_id, 'Dijawab')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      Tandai Sudah Didoakan / Dijawab
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Event */}
      {isEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Tambah Jadwal / Event Ibadah</h3>
              <button onClick={() => setIsEventModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Agenda / Event *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibadah Kebaktian Kebangunan Rohani (KKR)"
                  value={eventForm.nama}
                  onChange={(e) => setEventForm({ ...eventForm, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kategori Agenda</label>
                <select
                  value={eventForm.kategori}
                  onChange={(e) => setEventForm({ ...eventForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Ibadah Raya">Ibadah Raya</option>
                  <option value="Komsel / Doa">Komsel / Persekutuan Doa</option>
                  <option value="Ibadah Pemuda">Ibadah Pemuda / Youth</option>
                  <option value="Event Spesial / KKR">Event Spesial / KKR</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tanggal & Waktu</label>
                <input
                  type="date"
                  value={eventForm.tanggal}
                  onChange={(e) => setEventForm({ ...eventForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Jam Pelaksanaan</label>
                <input
                  type="text"
                  placeholder="09:00 - 11:30 WIB"
                  value={eventForm.jam}
                  onChange={(e) => setEventForm({ ...eventForm, jam: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pembicara / Pelayan</label>
                <input
                  type="text"
                  value={eventForm.pembicara}
                  onChange={(e) => setEventForm({ ...eventForm, pembicara: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEventModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Doa */}
      {isDoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Kirim Permohonan Doa Jemaat</h3>
              <button onClick={() => setIsDoaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDoa} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Pemohon</label>
                <input
                  type="text"
                  required
                  value={doaForm.nama_pemohon}
                  onChange={(e) => setDoaForm({ ...doaForm, nama_pemohon: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kategori Doa</label>
                <select
                  value={doaForm.kategori}
                  onChange={(e) => setDoaForm({ ...doaForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Kesehatan & Kesembuhan">Kesehatan & Kesembuhan</option>
                  <option value="Pekerjaan & Usaha">Pekerjaan & Usaha</option>
                  <option value="Keluarga & Pernikahan">Keluarga & Pernikahan</option>
                  <option value="Pertumbuhan Rohani">Pertumbuhan Rohani</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Isi Pokok Doa *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan isi beban doa Anda..."
                  value={doaForm.isi_permohonan}
                  onChange={(e) => setDoaForm({ ...doaForm, isi_permohonan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsDoaModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-rose-600 rounded-xl font-bold">
                  Kirim Doa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
