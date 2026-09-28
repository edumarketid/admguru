import { StateManager } from './state.js';
import { ApiService } from './api.js';
import { ScannerModule } from './scanner.js';
import { AuthModule } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginModal = document.getElementById('login-modal');
  const syncText = document.getElementById('sync-text');

  if (syncText) syncText.textContent = 'Memuat Data...';
  await ApiService.fetchFromCloud();
  if (syncText) syncText.textContent = 'Online ✓';

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
      const err = document.getElementById('login-error');
      err.textContent = res.message;
      err.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => AuthModule.logout());
});

function initAppUI(session) {
  document.getElementById('header-role-title').textContent = session.role === 'siswa' ? `Siswa: ${session.name} (${session.kelas})` : `Guru: ${session.name}`;

  if (session.role === 'siswa') {
    renderSiswaDashboard(session);
  } else {
    renderGuruDashboard(session);
  }

  // Navigasi Tab
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-target');
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.getElementById('tab-content-' + targetTab).classList.remove('hidden');
      navButtons.forEach(b => { b.classList.remove('text-sky-600', 'font-semibold'); b.classList.add('text-slate-400'); });
      btn.classList.remove('text-slate-400');
      btn.classList.add('text-sky-600', 'font-semibold');
    });
  });

  if (session.role === 'guru') ScannerModule.init();

  document.getElementById('sync-btn').addEventListener('click', async () => {
    document.getElementById('sync-text').textContent = 'Syncing...';
    try { await ApiService.syncToCloud(); document.getElementById('sync-text').textContent = 'Online ✓'; }
    catch (e) { document.getElementById('sync-text').textContent = 'Offline'; }
  });
}

function renderSiswaDashboard(session) {
  const main = document.querySelector('main');
  const state = StateManager.loadState();
  
  // Ambil jadwal kelas siswa
  const jadwalKelas = state.jadwal.filter(j => j.kelas === session.kelas);
  // Ambil tugas untuk kelas siswa
  const tugasKelas = state.tugas.filter(t => t.kelas === session.kelas);
  // Ambil materi untuk kelas siswa
  const materiKelas = state.materi.filter(m => m.kelas === session.kelas);
  // Ambil inbox untuk siswa
  const inboxSiswa = state.inbox.filter(i => i.penerimaRole === 'siswa' || i.target === session.kelas);

  main.innerHTML = `
    <!-- BERANDA SISWA -->
    <div id="tab-content-beranda" class="tab-pane space-y-6">
      <div class="bg-gradient-to-br from-indigo-600 to-sky-600 text-white p-5 rounded-2xl shadow-lg space-y-2">
        <p class="text-xs text-indigo-100">Portal Siswa Terpadu v1.1.0</p>
        <h2 class="text-xl font-bold">${session.name}</h2>
        <p class="text-xs">Kelas: <b>${session.kelas}</b> | NISN: <b>${session.username}</b></p>
      </div>

      <!-- KARTU QR DIGITAL -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-center space-y-2">
        <h3 class="font-bold text-slate-800 text-xs">Kartu Presensi QR Code</h3>
        <div class="w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl mx-auto flex flex-col items-center justify-center p-2">
          <i class="fa-solid fa-qrcode text-4xl text-sky-600 mb-1"></i>
          <span class="text-[10px] font-bold text-slate-700">${session.idSiswa || session.username}</span>
        </div>
      </div>

      <!-- GURU MAPEL TERKAIT (DENGAN TOMBOL WHATSAPP) -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Guru Pengampu & Kontak WA</h3>
        <div class="space-y-2">
          ${jadhavUnikGuru(jadwalKelas).map(g => `
            <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <p class="font-bold text-slate-700">${g.namaGuru}</p>
                <p class="text-[11px] text-sky-600 font-medium">${g.mapel}</p>
                <p class="text-[10px] text-slate-400"><i class="fa-solid fa-phone mr-1"></i>${g.noHpGuru || '-'}</p>
              </div>
              ${g.noHpGuru ? `
                <a href="https://wa.me/${g.noHpGuru}?text=Halo%20${encodeURIComponent(g.namaGuru)},%20saya%20${encodeURIComponent(session.name)}%20dari%20kelas%20${encodeURIComponent(session.kelas)}" target="_blank" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition">
                  <i class="fa-brands fa-whatsapp text-sm"></i> WA
                </a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- JADWAL SISWA -->
    <div id="tab-content-jadwal" class="tab-pane hidden space-y-4">
      <h2 class="font-bold text-slate-800 text-base">Jadwal Pelajaran Kelas ${session.kelas}</h2>
      <div class="space-y-2">
        ${jadwalKelas.length === 0 ? '<p class="text-xs text-slate-400 text-center py-6">Belum ada jadwal.</p>' :
          jadwalKelas.map(j => `
            <div class="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span class="bg-sky-50 text-sky-700 px-2 py-0.5 rounded font-bold text-[10px]">${j.hari} -${j.jam}</span>
                <h4 class="font-bold text-slate-800 mt-1">${j.mapel}</h4>
                <p class="text-slate-400 text-[11px]">${j.namaGuru}</p>
              </div>
            </div>
          `).join('')}
      </div>
    </div>

    <!-- KELAS / MATERI & TUGAS SISWA -->
    <div id="tab-content-kelas" class="tab-pane hidden space-y-5">
      <div class="space-y-3">
        <h2 class="font-bold text-slate-800 text-base">Materi & Tugas Pembelajaran</h2>
        
        <!-- Daftar Tugas -->
        <div class="space-y-2">
          <p class="text-xs font-bold text-slate-500">Tugas Aktif</p>
          ${tugasKelas.length === 0 ? '<p class="text-xs text-slate-400">Tidak ada tugas aktif.</p>' :
            tugasKelas.map(t => `
              <div class="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs space-y-1.5">
                <div class="flex justify-between font-bold text-amber-900">
                  <span>${t.judulTugas} (${t.mapel})</span>
                  <span class="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded">Deadline: ${t.deadline}</span>
                </div>
                <p class="text-slate-600">${t.deskripsi}</p>
                <p class="text-[10px] text-slate-400">Oleh: ${t.namaGuru}</p>
              </div>
            `).join('')}
        </div>

        <!-- Daftar Materi -->
        <div class="space-y-2 pt-2">
          <p class="text-xs font-bold text-slate-500">Materi Pelajaran</p>
          ${materiKelas.length === 0 ? '<p class="text-xs text-slate-400">Belum ada materi.</p>' :
            materiKelas.map(m => `
              <div class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <p class="font-bold text-slate-800">${m.judul} (${m.mapel})</p>
                  <p class="text-[10px] text-slate-400">Oleh: ${m.namaGuru}</p>
                </div>
                ${m.linkMateri ? `<a href="${m.linkMateri}" target="_blank" class="bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg font-bold text-[11px]">Buka</a>` : ''}
              </div>
            `).join('')}
        </div>
      </div>
    </div>

    <!-- PROFIL / INBOX SISWA -->
    <div id="tab-content-profil" class="tab-pane hidden space-y-4">
      <h2 class="font-bold text-slate-800 text-base">Inbox & Pemberitahuan</h2>
      <div class="space-y-2">
        ${inboxSiswa.length === 0 ? '<p class="text-xs text-slate-400 text-center py-6">Tidak ada pesan baru.</p>' :
          inboxSiswa.map(i => `
            <div class="bg-white p-4 rounded-xl border border-slate-100 text-xs space-y-1">
              <div class="font-bold text-slate-800 flex justify-between">
                <span><i class="fa-solid fa-envelope text-sky-600 mr-1"></i> ${i.judul}</span>
                <span class="text-[10px] text-slate-400">${i.tanggal}</span>
              </div>
              <p class="text-slate-600">${i.pesan}</p>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function jadhavUnikGuru(jadwalList) {
  const map = new Map();
  jadwalList.forEach(j => { if(!map.has(j.mapel)) map.set(j.mapel, j); });
  return Array.from(map.values());
}

function renderGuruDashboard(session) {
  // Tampilan Guru (Menu Upload Tugas & Materi)
  const tabKelas = document.getElementById('tab-content-kelas');
  tabKelas.innerHTML = `
    <h2 class="font-bold text-slate-800 text-base">Upload Materi & Tugas Pembelajaran</h2>
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 text-xs">
      <div>
        <label class="block font-bold text-slate-700 mb-1">Jenis Unggahan</label>
        <select id="upload-type" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <option value="materi">Materi Pelajaran</option>
          <option value="tugas">Tugas Siswa</option>
        </select>
      </div>
      <div>
        <label class="block font-bold text-slate-700 mb-1">Kelas Tujuan</label>
        <input type="text" id="up-kelas" placeholder="Contoh: XI TKJ 1" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
      </div>
      <div>
        <label class="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
        <input type="text" id="up-mapel" placeholder="Komputer Jaringan" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
      </div>
      <div>
        <label class="block font-bold text-slate-700 mb-1">Judul / Topik</label>
        <input type="text" id="up-judul" placeholder="Judul materi atau tugas" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
      </div>
      <div>
        <label class="block font-bold text-slate-700 mb-1">Link File / Deskripsi</label>
        <textarea id="up-desc" rows="3" placeholder="Link Google Drive atau instruksi tugas..." class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"></textarea>
      </div>
      <button id="submit-upload-btn" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl transition">
        Publikasikan ke Siswa
      </button>
      <div id="status-upload" class="text-center font-medium text-emerald-600 hidden">Berhasil dipublikasikan & dikirim ke Inbox siswa!</div>
    </div>
  `;

  document.getElementById('submit-upload-btn').addEventListener('click', async () => {
    const type = document.getElementById('upload-type').value;
    const kelas = document.getElementById('up-kelas').value.trim();
    const mapel = document.getElementById('up-mapel').value.trim();
    const judul = document.getElementById('up-judul').value.trim();
    const desc = document.getElementById('up-desc').value.trim();
    const today = new Date().toISOString().slice(0, 10);

    if (!kelas || !judul) {
      alert('Kelas dan Judul wajib diisi!');
      return;
    }

    const state = StateManager.loadState();
    if (type === 'materi') {
      state.materi.push({ idMateri: 'M_' + Date.now(), mapel, kelas, judul, linkMateri: desc, namaGuru: session.name, tanggal: today });
    } else {
      state.tugas.push({ idTugas: 'T_' + Date.now(), mapel, kelas, judulTugas: judul, deskripsi: desc, deadline: '7 Hari', namaGuru: session.name, tanggal: today });
    }

    // Buat otomatis pesan Inbox untuk siswa di kelas tersebut
    state.inbox.push({
      idPesan: 'MSG_' + Date.now(),
      penerimaRole: 'siswa',
      target: kelas,
      judul: `Baru: ${type.toUpperCase()} ${mapel}`,
      pesan: `${session.name} mempublikasikan ${type}: "${judul}" untuk kelas ${kelas}.`,
      tanggal: today
    });

    StateManager.saveState(state);
    try { await ApiService.syncToCloud(); } catch(e) {}

    const stat = document.getElementById('status-upload');
    stat.classList.remove('hidden');
    setTimeout(() => stat.classList.add('hidden'), 2500);
  });
}
