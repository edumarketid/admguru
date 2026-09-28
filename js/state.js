import { CONFIG } from './config.js';

const STORAGE_KEY = 'APLIKASI_GURU_STATE_V137';

export const StateManager = {
  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { 
        siswa: [
          { idSiswa: 'S001', nis: '1001', nama: 'Ahmad Siswa', kelas: 'XI TKJ 1', keterangan: 'Aktif' },
          { idSiswa: 'S002', nis: '1002', nama: 'Siti Murid', kelas: 'XI TKJ 1', keterangan: 'Aktif' }
        ], 
        guru: [
          { no: '1', namaGuru: 'Ajiardin, S.T.', nip: '19850101...', statusPegawai: 'PNS', mapel: 'Komputer Jaringan', noHp: '081234567890', status: 'Aktif', password: '12345' }
        ],
        kehadiran: [], 
        profil: {
          namaGuru: 'Ajiardin, S.T.',
          nipGuru: '19850101...',
          namaKepsek: '',
          nipKepsek: '',
          namaSekolah: 'SMK Negeri 1 Wakatobi',
          tahunAjaran: '2026/2027',
          logoBase64: '',
          kopBase64: '',
          gasUrl: CONFIG.DEFAULT_GAS_URL
        } 
      };
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.profil) parsed.profil = {};
      if (!parsed.profil.gasUrl) parsed.profil.gasUrl = CONFIG.DEFAULT_GAS_URL;
      if (!parsed.siswa) parsed.siswa = [];
      if (!parsed.guru) parsed.guru = [];
      if (!parsed.kehadiran) parsed.kehadiran = [];
      return parsed;
    } catch (e) {
      return { siswa: [], guru: [], kehadiran: [], profil: { gasUrl: CONFIG.DEFAULT_GAS_URL } };
    }
  },

  saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  getGasUrl() {
    const state = this.loadState();
    return state.profil?.gasUrl || CONFIG.DEFAULT_GAS_URL;
  },

  getProfil() {
    const state = this.loadState();
    return state.profil || {};
  },

  saveProfil(newProfilData) {
    const state = this.loadState();
    state.profil = { ...state.profil, ...newProfilData };
    this.saveState(state);
  }
};
