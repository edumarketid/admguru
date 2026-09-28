import { CONFIG } from './config.js';

const STORAGE_KEY = 'APLIKASI_GURU_STATE_V137';

export const StateManager = {
  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { 
        siswa: [{ idSiswa: 'S001', nisn: '123456', nis: '1001', nama: 'Ahmad Siswa', kelas: 'XI TKJ 1', password: '12345' }], 
        guru: [{ no: '1', namaGuru: 'Ajiardin, S.T.', nip: '1985...', mapel: 'Komputer Jaringan', noHp: '081234567890', password: '12345' }],
        jadwal: [{ idJadwal: 'J1', hari: 'Senin', jam: '07:30 - 09:00', kelas: 'XI TKJ 1', mapel: 'Komputer Jaringan', noHpGuru: '081234567890', namaGuru: 'Ajiardin, S.T.' }],
        materi: [],
        tugas: [],
        inbox: [],
        kehadiran: [], 
        profil: { namaSekolah: 'SMK Negeri 1 Wakatobi', tahunAjaran: '2026/2027', gasUrl: CONFIG.DEFAULT_GAS_URL } 
      };
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.materi) parsed.materi = [];
      if (!parsed.tugas) parsed.tugas = [];
      if (!parsed.inbox) parsed.inbox = [];
      if (!parsed.jadwal) parsed.jadwal = [];
      return parsed;
    } catch (e) {
      return { siswa: [], guru: [], jadwal: [], materi: [], tugas: [], inbox: [], kehadiran: [], profil: { gasUrl: CONFIG.DEFAULT_GAS_URL } };
    }
  },
  saveState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); },
  getGasUrl() { const state = this.loadState(); return state.profil?.gasUrl || CONFIG.DEFAULT_GAS_URL; },
  getProfil() { const state = this.loadState(); return state.profil || {}; },
  saveProfil(p) { const state = this.loadState(); state.profil = { ...state.profil, ...p }; this.saveState(state); }
};
