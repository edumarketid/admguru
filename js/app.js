import { StateManager } from './state.js';
import { ApiService } from './api.js';
import { ScannerModule } from './scanner.js';
import { AuthModule } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Cek Sesi Login
  const session = AuthModule.getSession();
  const loginModal = document.getElementById('login-modal');

  if (session) {
    loginModal.classList.add('hidden');
    initAppUI(session);
  } else {
    loginModal.classList.remove('hidden');
  }

  // Tombol Submit Login
  document.getElementById('login-btn').addEventListener('click', () => {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const res = AuthModule.login(u, p);
    
    if (res.success) {
      loginModal.classList.add('hidden');
      window.location.reload();
    } else {
      const errEl = document.getElementById('login-error');
      errEl.textContent = res.message;
      errEl.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    AuthModule.logout();
  });
});

function initAppUI(session) {
  // Tampilkan role di header
  document.getElementById('header-role-title').textContent = session.role === 'admin' ? 'Administrator' : `Guru: ${session.name}`;

  // Tampilkan panel admin jika role admin
  if (session.role === 'admin') {
    document.getElementById('admin-panel').classList.remove('hidden');
    populateGuruSelect();
  }

  // Muat data profil ke form
  const profil = StateManager.getProfil();
  if (profil.namaSekolah) document.getElementById('header-school-name').textContent = profil.namaSekolah;
  document.getElementById('gas-url-input').value = StateManager.getGasUrl();
  document.getElementById('input-nama-guru').value = session.role === 'guru' ? session.name : (profil.namaGuru || '');
  document.getElementById('input-nohp-guru').value = session.username || '';

  // Fitur Ubah Password Mandiri (Guru / Admin)
  document.getElementById('update-pass-btn').addEventListener('click', () => {
    const newPass = document.getElementById('input-new-pass').value.trim();
    if (newPass.length < 5) {
      alert('Password minimal 5 karakter!');
      return;
    }

    const state = StateManager.loadState();
    if (session.role === 'admin') {
      alert('Password admin default tetap admin12345. Gunakan fitur ubah akun jika perlu.');
    } else {
      const guru = state.guru.find(g => g.noHp === session.username);
      if (guru) {
        guru.password = newPass;
        StateManager.saveState(state);
        const statusEl = document.getElementById('status-pass');
        statusEl.classList.remove('hidden');
        setTimeout(() => statusEl.classList.add('hidden'), 2500);
      }
    }
  });

  // Fitur Reset Password Guru oleh Admin
  document.getElementById('reset-guru-pass-btn').addEventListener('click', () => {
    const targetNoHp = document.getElementById('select-reset-guru').value;
    const state = StateManager.loadState();
    const guru = state.guru.find(g => g.noHp === targetNoHp);
    if (guru) {
      guru.password = '12345';
      StateManager.saveState(state);
      const statusEl = document.getElementById('status-reset');
      statusEl.classList.remove('hidden');
      setTimeout(() => statusEl.classList.add('hidden'), 2500);
    }
  });

  // Simpan Profil
  document.getElementById('save-profile-btn').addEventListener('click', () => {
    const newProfil = {
      namaGuru: document.getElementById('input-nama-guru').value.trim(),
      gasUrl: document.getElementById('gas-url-input').value.trim()
    };
    StateManager.saveProfil(newProfil);
    const notif = document.getElementById('status-profil');
    notif.classList.remove('hidden');
    setTimeout(() => notif.classList.add('hidden'), 2500);
  });

  // Navigasi Tab
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-target');
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.getElementById('tab-content-' + targetTab).classList.remove('hidden');
      navButtons.forEach(b => {
        b.classList.remove('text-sky-600', 'font-semibold');
        b.classList.add('text-slate-400', 'font-medium');
      });
      btn.classList.remove('text-slate-400', 'font-medium');
      btn.classList.add('text-sky-600', 'font-semibold');
    });
  });

  ScannerModule.init();

  document.getElementById('sync-btn').addEventListener('click', async () => {
    const syncText = document.getElementById('sync-text');
    syncText.textContent = 'Syncing...';
    try {
      await ApiService.syncToCloud();
      syncText.textContent = 'Online ✓';
    } catch (err) {
      syncText.textContent = 'Offline Mode';
    }
  });
}

function populateGuruSelect() {
  const state = StateManager.loadState();
  const select = document.getElementById('select-reset-guru');
  select.innerHTML = '';
  if (state.guru) {
    state.guru.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.noHp;
      opt.textContent = `${g.namaGuru} (${g.noHp})`;
      select.appendChild(opt);
    });
  }
}
