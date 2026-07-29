import React, { useState } from 'react';
import { User } from '../../types';
import { StorageManager } from '../../utils/storage';
import { exportToExcel, exportToPDF } from '../../utils/exportTools';
import { FileSpreadsheet, FileText, Printer, CheckCircle, Download, Database } from 'lucide-react';

interface LaporanViewProps {
  currentUser: User;
}

export const LaporanView: React.FC<LaporanViewProps> = ({ currentUser }) => {
  const [selectedModule, setSelectedModule] = useState('JEMAAT');

  const reportModules = [
    { id: 'JEMAAT', title: '02_JEMAAT - Master Data Jemaat & NIK', desc: 'Data lengkap seluruh jemaat, status baptis/sidi, komisi, & wilayah' },
    { id: 'KELUARGA', title: '03_KELUARGA - Kartu Keluarga (KK)', desc: 'Data kepala keluarga, alamat, nomor KK, dan anggota keluarga' },
    { id: 'WILAYAH', title: '04_WILAYAH - Sebaran Wilayah Rayon', desc: 'Daftar wilayah gereja, penatua ketua wilayah, dan statistik' },
    { id: 'PELAYANAN', title: '05_PELAYANAN - Komisi & Tim Ibadah', desc: 'Daftar komisi pemuda, bapa, wanita, sekolah minggu, & tim musik' },
    { id: 'BAPTISAN', title: '06_BAPTISAN - Sacraments Baptisan', desc: 'Data surat baptisan kudus, nomor registrasi, & pendeta pembaptis' },
    { id: 'SIDI', title: '07_SIDI - Peneguhan Sidi Jemaat', desc: 'Data surat sidi, tanggal peneguhan, dan pendeta melayani' },
    { id: 'PERNIKAHAN', title: '08_PERNIKAHAN - Pemberkatan Nikah', desc: 'Data akta nikah gereja, mempelai pria/wanita, dan tanggal nikah' },
    { id: 'PERSEMBAHAN', title: '09_PERSEMBAHAN - Keuangan Ibadah', desc: 'Catatan persembahan minggu, perpuluhan, syukur, & diakonia' },
    { id: 'DONASI', title: '10_DONASI - Donasi Pembangunan', desc: 'Penerimaan dana donasi khusus gedung & pembangunan' },
    { id: 'KAS', title: '11_KAS_PENGELUARAN - Arus Kas & Biaya', desc: 'Detail pengeluaran operasional, listrik, maintenance & saldo kas' }
  ];

  const handleGenerateExcel = (modId: string) => {
    switch (modId) {
      case 'JEMAAT':
        exportToExcel(StorageManager.getJemaat(), 'Laporan_02_JEMAAT');
        break;
      case 'KELUARGA':
        exportToExcel(StorageManager.getKeluarga(), 'Laporan_03_KELUARGA');
        break;
      case 'WILAYAH':
        exportToExcel(StorageManager.getWilayah(), 'Laporan_04_WILAYAH');
        break;
      case 'PELAYANAN':
        exportToExcel(StorageManager.getPelayanan(), 'Laporan_05_PELAYANAN');
        break;
      case 'BAPTISAN':
        exportToExcel(StorageManager.getBaptisan(), 'Laporan_06_BAPTISAN');
        break;
      case 'SIDI':
        exportToExcel(StorageManager.getSidi(), 'Laporan_07_SIDI');
        break;
      case 'PERNIKAHAN':
        exportToExcel(StorageManager.getPernikahan(), 'Laporan_08_PERNIKAHAN');
        break;
      case 'PERSEMBAHAN':
        exportToExcel(StorageManager.getPersembahan(), 'Laporan_09_PERSEMBAHAN');
        break;
      case 'DONASI':
        exportToExcel(StorageManager.getDonasi(), 'Laporan_10_DONASI');
        break;
      case 'KAS':
        exportToExcel(StorageManager.getKasPengeluaran(), 'Laporan_11_KAS_PENGELUARAN');
        break;
      default:
        break;
    }
  };

  const handleGeneratePDF = (modId: string) => {
    let title = '';
    let headers: string[] = [];
    let rows: any[][] = [];

    if (modId === 'JEMAAT') {
      const data = StorageManager.getJemaat();
      title = 'LAPORAN MASTER DATA JEMAAT GEREJA (02_JEMAAT)';
      headers = ['ID', 'NIK', 'Nama Lengkap', 'JK', 'Wilayah', 'Komisi', 'Status'];
      rows = data.map((j) => [j.jemaat_id, j.nik, j.nama_lengkap, j.jenis_kelamin, j.wilayah, j.komisi, j.status]);
    } else if (modId === 'PERSEMBAHAN') {
      const data = StorageManager.getPersembahan();
      title = 'LAPORAN REKAPITULASI PERSEMBAHAN GEREJA (09_PERSEMBAHAN)';
      headers = ['ID', 'Tanggal', 'Jenis', 'Metode', 'Keterangan', 'Jumlah (Rp)'];
      rows = data.map((p) => [p.persembahan_id, p.tanggal, p.jenis, p.metode_pembayaran || 'Tunai', p.keterangan, `Rp ${p.jumlah.toLocaleString('id-ID')}`]);
    } else if (modId === 'KAS') {
      const data = StorageManager.getKasPengeluaran();
      title = 'LAPORAN ARUS KAS & PENGELUARAN (11_KAS_PENGELUARAN)';
      headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Jumlah (Rp)'];
      rows = data.map((k) => [k.kas_id, k.tanggal, k.tipe, k.kategori, k.keterangan, `Rp ${k.jumlah.toLocaleString('id-ID')}`]);
    } else {
      const data = StorageManager.getJemaat();
      title = `LAPORAN RESMI CMS PRO GEREJA (${modId})`;
      headers = ['ID', 'Informasi Module', 'Tanggal Cetak'];
      rows = data.map((j) => [j.jemaat_id, j.nama_lengkap, new Date().toLocaleDateString('id-ID')]);
    }

    exportToPDF(title, headers, rows, undefined, `Laporan_${modId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
          <span>Pusat Cetak & Generator Laporan (PDF & Excel)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate dokumen resmi laporan gereja dari 18 lembar database Google Sheets dengan sekali klik.
        </p>
      </div>

      {/* Grid Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportModules.map((mod) => (
          <div
            key={mod.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-3 shadow-md hover:border-indigo-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-base text-white">{mod.title}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{mod.desc}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Ready Sync
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateExcel(mod.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleGeneratePDF(mod.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
