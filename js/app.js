import { StateManager } from './state.js';
import { ApiService } from './api.js';
import { ScannerModule } from './scanner.js';
import { AuthModule } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginModal = document.getElementById('login-modal');
  const syncText = document.getElementById('sync-text');

  if (syncText) syncText.textContent = 'Memuat Data...';
  const successFetched = await ApiService.fetchFromCloud();
  if (syncText) syncText.textContent = successFetched ? 'Online ✓' : 'Offline Mode';

  const session = AuthModule.getSession();
  if (session) {
    loginModal.classList.add('hidden');
    initAppUI(session);
  } else {
    loginModal.classList.remove('hidden');
  }

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
  const roleTitle = session.role === 'admin' ? 'Administrator' : (session.role === 'guru' ? `Guru: ${session.name}` : `Siswa: ${session.name} (${session.kelas})`);
  document.getElementById('header-role-title').textContent = roleTitle;

  // Jika SISWA login, sesuaikan tampilan Beranda & sembunyikan fitur guru
  if (session.role === 'siswa') {
    renderSiswaDashboard(session);
  } else if (session.role === 'admin') {
    document.getElementById('admin-panel').classList.remove('hidden');
    populateGuruSelect();
  }

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

  if (session.role !== 'siswa') {
    ScannerModule.init();
  }

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

function renderSiswaDashboard(session) {
  const mainContainer = document.querySelector('main');
  const state = StateManager.loadState();
  const kehadiranSiswa = state.kehadiran.filter(k => k.idSiswa === session.idSiswa || k.nisn === session.username);

  mainContainer.innerHTML = `
    <!-- DASHBOARD KHUSUS SISWA -->
    <div class="space-y-6">
      <div class="bg-gradient-to-br from-indigo-600 to-sky-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-indigo-100 font-medium">Portal Siswa v1.1.0</p>
            <h2 class="text-xl font-bold mt-0.5">${session.name}</h2>
          </div>
          <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">${session.kelas}</span>
        </div>
        <div class="pt-3 border-t border-white/15 flex justify-between text-xs">
          <span>NISN: <b>${session.username}</b></span>
          <span>Total Hadir: <b class="text-emerald-300">${kehadiranSiswa.length} Pertemuan</b></span>
        </div>
      </div>

      <!-- KARTU QR CODE DIGITAL SISWA -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center space-y-3">
        <h3 class="font-bold text-slate-800 text-sm">Kartu Presensi Digital</h3>
        <p class="text-xs text-slate-400">Tunjukkan QR Code ini kepada guru saat masuk kelas</p>
        <div class="w-40 h-40 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl mx-auto flex flex-col items-center justify-center p-2">
          <i class="fa-solid fa-qrcode text-5xl text-sky-600 mb-1"></i>
          <span class="text-[11px] font-bold text-slate-700">${session.idSiswa || session.username}</span>
        </div>
      </div>

      <!-- RIWAYAT KEHADIRAN PRIBADI -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Riwayat Kehadiran Terbaru</h3>
        <div class="space-y-2">
          ${kehadiranSiswa.length === 0 ? '<p class="text-xs text-slate-400 text-center py-4">Belum ada catatan kehadiran.</p>' : 
            kehadiranSiswa.map(k => `
              <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <p class="font-bold text-slate-700">${k.tanggal}</p>
                  <p class="text-[10px] text-slate-400">${k.catatan || 'Scan Presensi'}</p>
                </div>
                <span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px]">${k.status}</span>
              </div>
            `).join('')}
        </div>
      </div>
    </div>
  `;
}
