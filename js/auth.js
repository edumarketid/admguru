import { StateManager } from './state.js';

export const AuthModule = {
  login(username, password) {
    username = username.trim();
    password = password.trim();

    // 1. Cek Admin
    if (username === 'admin' && password === 'admin12345') {
      const session = { role: 'admin', name: 'Administrator', username: 'admin' };
      localStorage.setItem('ACTIVE_SESSION', JSON.stringify(session));
      return { success: true, role: 'admin' };
    }

    const state = StateManager.loadState();

    // 2. Cek Guru (via No. HP)
    if (!state.guru) state.guru = [];
    const guru = state.guru.find(g => g.noHp === username);
    if (guru) {
      if ((guru.password || '12345') === password) {
        const session = { role: 'guru', name: guru.namaGuru, username: guru.noHp, nip: guru.nip, mapel: guru.mapel };
        localStorage.setItem('ACTIVE_SESSION', JSON.stringify(session));
        return { success: true, role: 'guru' };
      }
    }

    // 3. Cek Siswa (via NISN)
    if (!state.siswa) state.siswa = [];
    const siswa = state.siswa.find(s => s.nisn === username);
    if (siswa) {
      if ((siswa.password || '12345') === password) {
        const session = { role: 'siswa', name: siswa.nama, username: siswa.nisn, nis: siswa.nis, kelas: siswa.kelas, idSiswa: siswa.idSiswa };
        localStorage.setItem('ACTIVE_SESSION', JSON.stringify(session));
        return { success: true, role: 'siswa' };
      }
    }

    return { success: false, message: 'ID/NISN atau Password salah!' };
  },

  getSession() {
    const raw = localStorage.getItem('ACTIVE_SESSION');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  logout() {
    localStorage.removeItem('ACTIVE_SESSION');
    window.location.reload();
  }
};
