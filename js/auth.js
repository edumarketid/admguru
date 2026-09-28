import { StateManager } from './state.js';

export const AuthModule = {
  login(username, password) {
    username = username.trim();
    password = password.trim();

    // Cek Login Admin Default
    if (username === 'admin' && password === 'admin12345') {
      const adminSession = { role: 'admin', name: 'Administrator', username: 'admin' };
      localStorage.setItem('ACTIVE_SESSION', JSON.stringify(adminSession));
      return { success: true, role: 'admin' };
    }

    // Cek Login Guru dari Data Guru
    const state = StateManager.loadState();
    if (!state.guru) state.guru = [];

    const guru = state.guru.find(g => g.noHp === username);
    if (guru) {
      const storedPass = guru.password || '12345';
      if (storedPass === password) {
        const guruSession = { role: 'guru', name: guru.namaGuru, username: guru.noHp, nip: guru.nip };
        localStorage.setItem('ACTIVE_SESSION', JSON.stringify(guruSession));
        return { success: true, role: 'guru' };
      }
    }

    return { success: false, message: 'Nomor HP atau Password salah!' };
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
