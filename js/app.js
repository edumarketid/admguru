import { StateManager } from './state.js';
import { ApiService } from './api.js';
import { ScannerModule } from './scanner.js';
import { AuthModule } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginModal = document.getElementById('login-modal');
  const syncText = document.getElementById('sync-text');

  // Coba tarik data terbaru dari Spreadsheet (Cloud) terlebih dahulu agar DataGuru ter-update
  if (syncText) syncText.textContent = 'Memuat Data...';
  const successFetched = await ApiService.fetchFromCloud();
  if (syncText) syncText.textContent = successFetched ? 'Online ✓' : 'Offline Mode';

  // Cek Sesi Login yang Aktif
  const session = AuthModule.getSession();
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
    
    // Validasi login menggunakan data guru terbaru yang sudah tersinkron
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
  document.getElementById('header-role-title').textContent = session.role === 'admin' ? 'Administrator' : `Guru: ${session.name}`;

  if (session.role === 'admin') {
    document.getElementById('admin-panel').classList.remove('hidden');
    populateGuruSelect();
  }

  const profil = StateManager.getProfil();
  if (profil.namaSekolah) document.getElementById('header-school-name').textContent = profil.namaSekolah;
  document.getElementById('gas-url-input').value = StateManager.getGasUrl();
  document.getElementById('input-nama-guru').value = session.role === 'guru' ? session.name : (profil.namaGuru || '');
  document.getElementById('input-nohp-guru').value = session.username || '';

  // Fitur Ubah Password Mandiri (Guru)
  document.getElementById('update-pass-btn').addEventListener('click', async () => {
    const newPass = document.getElementById('input-new-pass').value.trim();
    if (newPass.length < 5) {
      alert('Password minimal 5 karakter!');
      return;
    }

    const state = StateManager.loadState();
    if (session.role === 'admin') {
      alert('Password admin default tetap admin12345.');
    } else {
      const guru = state.guru.find(g => g.noHp === session.username);
      if (guru) {
        guru.password = newPass;
        StateManager.saveState(state);

        // Sinkronisasi otomatis ke cloud agar spreadsheet ikut terupdate password barunya
        try {
          await ApiService.syncToCloud();
        } catch(e) { console.error("Sync password error:", e); }

        const statusEl = document.getElementById('status-pass');
        statusEl.classList.remove('hidden');
        setTimeout(() => statusEl.classList.add('hidden'), 2500);
      }
    }
  });

  // Fitur Reset Password Guru oleh Admin
  document.getElementById('reset-guru-pass-btn').addEventListener('click', async () => {
    const targetNoHp = document.getElementById('select-reset-guru').value;
    const state = StateManager.loadState();
    const guru = state.guru.find(g => g.noHp === targetNoHp);
    if (guru) {
      guru.password = '12345';
      StateManager.saveState(state);

      try {
        await ApiService.syncToCloud();
      } catch(e) { console.error("Sync reset error:", e); }

      const statusEl = document.getElementById('status-reset');
      statusEl.classList.remove('hidden');
      setTimeout(() => statusEl.classList.add('hidden'), 2500);
    }
  });

  // Simpan Profil
  document.getElementById('save-profile-btn').addEventListener('click', async () => {
    const newProfil = {
      namaGuru: document.getElementById('input-nama-guru').value.trim(),
      gasUrl: document.getElementById('gas-url-input').value.trim()
    };
    StateManager.saveProfil(newProfil);
    
    try {
      await ApiService.syncToCloud();
    } catch(e) {}

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
