export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT';

export interface User {
  user_id: string;
  username: string;
  password_hash?: string;
  nama: string;
  role: UserRole;
  email: string;
  no_hp?: string;
  status: 'Aktif' | 'Nonaktif';
  created_at?: string;
  last_login?: string;
  jemaat_id?: string;
  foto?: string;
}

export interface Jemaat {
  jemaat_id: string;
  nik: string;
  no_kk: string;
  nama_lengkap: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  wilayah: string;
  komisi: string;
  status_baptis: 'Sudah' | 'Belum';
  status_sidi: 'Sudah' | 'Belum';
  status_pernikahan: 'Belum Menikah' | 'Menikah' | 'Janda/Duda';
  pekerjaan: string;
  nomor_hp: string;
  email: string;
  foto: string;
  status: 'Aktif' | 'Pindah' | 'Meninggal';
}

export interface Keluarga {
  keluarga_id: string;
  no_kk: string;
  kepala_keluarga: string;
  alamat: string;
  wilayah: string;
  jumlah_anggota?: number;
}

export interface Wilayah {
  wilayah_id: string;
  nama_wilayah: string;
  ketua: string;
  jumlah_jemaat: number;
}

export interface Pelayanan {
  pelayanan_id: string;
  nama: string;
  kategori: string;
  penanggung_jawab: string;
  jadwal?: string;
}

export interface Baptisan {
  baptisan_id: string;
  jemaat_id: string;
  nama_jemaat?: string;
  tanggal: string;
  pendeta: string;
  lokasi: string;
  nomor_surat?: string;
}

export interface Sidi {
  sidi_id: string;
  jemaat_id: string;
  nama_jemaat?: string;
  tanggal: string;
  pendeta: string;
  nomor_surat?: string;
}

export interface Pernikahan {
  nikah_id: string;
  suami: string;
  istri: string;
  tanggal: string;
  pendeta: string;
  lokasi?: string;
  nomor_surat?: string;
}

export interface Persembahan {
  persembahan_id: string;
  tanggal: string;
  jenis?: string;
  kategori?: string;
  jumlah: number;
  keterangan: string;
  metode_pembayaran?: string;
  petugas?: string;
}

export interface Donasi {
  donasi_id: string;
  nama: string;
  jumlah: number;
  tanggal: string;
  kategori?: string;
  keterangan?: string;
}

export interface KasPengeluaran {
  kas_id: string;
  tanggal: string;
  kategori: string;
  jumlah: number;
  tipe: 'Penerimaan' | 'Pengeluaran';
  keterangan: string;
  pic?: string;
}

export interface Doa {
  doa_id: string;
  nama_pemohon: string;
  kategori: string;
  isi_permohonan: string;
  tanggal: string;
  status: 'Proses Doa' | 'Dijawab';
}

export interface Pengumuman {
  pengumuman_id: string;
  judul: string;
  isi: string;
  tanggal: string;
  status?: 'Aktif' | 'Draft' | 'Arsip';
  kategori?: string;
  penulis?: string;
}

export interface Renungan {
  renungan_id: string;
  judul: string;
  isi: string;
  ayat?: string;
  ayat_alkitab?: string;
  tanggal: string;
  penulis?: string;
}

export interface EventSchedule {
  event_id: string;
  nama: string;
  lokasi: string;
  tanggal: string;
  jam: string;
  kategori?: string;
  pembicara?: string;
  keterangan?: string;
}

export interface GalleryItem {
  gallery_id: string;
  judul: string;
  foto: string;
  tipe?: 'Foto' | 'Video';
  video_url?: string;
  tanggal: string;
  kategori?: string;
  keterangan?: string;
  penulis?: string;
}

export interface NotificationItem {
  notif_id: string;
  user_id: string;
  judul: string;
  pesan: string;
  status_baca: 'Belum' | 'Sudah';
  tanggal: string;
  tujuan_role?: string;
  tipe?: 'Peringatan' | 'Informasi' | 'Penting';
  pengirim?: string;
  is_pinned?: boolean;
}

export interface FeaturedVideo {
  video_id: string;
  judul: string;
  video_url: string;
  keterangan?: string;
  is_active: boolean;
  tanggal: string;
  platform?: 'YouTube' | 'TikTok' | 'Instagram' | 'Direct';
  kategori?: string;
}

export interface AppSettings {
  nama_gereja: string;
  logo: string;
  alamat: string;
  email: string;
  telepon: string;
  website?: string;
  warna_tema?: string;
  // Social Media Video Feed Settings
  video_url?: string;
  video_title?: string;
  video_description?: string;
  video_enabled?: boolean;
  // Dashboard Visual Customization
  header_title?: string;
  header_subtitle?: string;
  theme_preset?: 'DARK_SLATE' | 'MIDNIGHT_BLUE' | 'DEEP_PURPLE' | 'WARM_GOLD' | 'FOREST_GREEN' | 'LUXE_LIGHT';
  accent_color?: 'INDIGO' | 'EMERALD' | 'AMBER' | 'ROSE' | 'CYAN' | 'PURPLE' | 'ROYAL_GOLD';
  card_style?: 'GLASS' | 'SOLID' | 'NEON' | 'FLAT';
  card_size?: 'COMPACT' | 'NORMAL' | 'SPACIOUS';
  font_family?: 'SANS' | 'SERIF' | 'MONO';
  // Jemaat Portal Visual Customization
  jemaat_banner_title?: string;
  jemaat_banner_subtitle?: string;
  jemaat_banner_bg?: 'GRADIENT_INDIGO' | 'GRADIENT_PURPLE' | 'GRADIENT_GOLD' | 'GRADIENT_EMERALD' | 'OBSIDIAN_NIGHT' | 'OCEAN_BLUE';
  jemaat_announcement_text?: string;
  show_jemaat_announcement_banner?: boolean;
  show_jemaat_offering_history?: boolean;
  show_jemaat_sacraments_card?: boolean;
  show_jemaat_social_video?: boolean;
  show_jemaat_daily_renungan?: boolean;
  show_jemaat_quick_doa?: boolean;
  show_jemaat_event_jadwal?: boolean;
  // Dashboard Widget Visibility Toggles
  show_video_widget?: boolean;
  show_renungan_widget?: boolean;
  show_pengumuman_widget?: boolean;
  show_event_widget?: boolean;
  show_stat_cards?: boolean;
  show_quick_actions?: boolean;
  show_prayer_widget?: boolean;
  show_finance_chart?: boolean;
  firebaseConfig?: {
    apiKey?: string;
    projectId?: string;
    authDomain?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  firebase_api_key?: string;
  firebase_project_id?: string;
  firebase_auth_domain?: string;
  firebase_storage_bucket?: string;
  firebase_messaging_sender_id?: string;
  firebase_app_id?: string;
  google_sheet_id?: string;
  gas_api_url?: string;
  google_apps_script_url?: string;
  timezone?: string;
  bahasa?: string;
}

export interface ActivityLog {
  log_id: string;
  user: string;
  aktivitas: string;
  tanggal: string;
  ip_address: string;
  module?: string;
}

export interface LoginHistory {
  history_id: string;
  user: string;
  login: string;
  logout: string;
  device: string;
  browser: string;
  ip_address: string;
}

export interface PrayerRequest {
  prayer_id: string;
  jemaat_name: string;
  topik: string;
  permohonan: string;
  tanggal: string;
  status: 'Diterima' | 'Dalam Doa' | 'Terjawab';
  is_private: boolean;
}
