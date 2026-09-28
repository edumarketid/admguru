import { StateManager } from './state.js';
import { ApiService } from './api.js';
import { ScannerModule } from './scanner.js';

document.addEventListener('DOMContentLoaded', () => {
  let tempLogoBase64 = '';
  let tempKopBase64 = '';

  const profil = StateManager.getProfil();
  if (profil.namaGuru) document.getElementById('input-nama-guru').value = profil.namaGuru;
  if (profil.nipGuru) document.getElementById('input-nip-guru').value = profil.nipGuru;
  if (profil.namaKepsek) document.getElementById('input-nama-kepsek').value = profil.namaKepsek;
  if (profil.nipKepsek) document.getElementById('input-nip-kepsek').value = profil.nipKepsek;
  if (profil.namaSekolah) {
    document.getElementById('input-nama-sekolah').value = profil.namaSekolah;
    document.getElementById('header-school-name').textContent = profil.namaSekolah;
  }
  if (profil.tahunAjaran) document.getElementById('input-tahun-ajaran').value = profil.tahunAjaran;
  
  const currentGasUrl = StateManager.getGasUrl();
  document.getElementById('gas-url-input').value = currentGasUrl;

  if (profil.namaGuru) {
    document.getElementById('welcome-teacher-name').textContent = `Selamat Datang, ${profil.namaGuru}`;
  }

  if (profil.logoBase64) {
    tempLogoBase64 = profil.logoBase64;
    document.getElementById('logo-preview-container').innerHTML = `<img src="${profil.logoBase64}" class="w-full h-full object-cover">`;
  }
  if (profil.kopBase64) {
    tempKopBase64 = profil.kopBase64;
    document.getElementById('kop-preview-container').innerHTML = `<img src="${profil.kopBase64}" class="w-full h-full object-contain">`;
  }

  document.getElementById('input-logo-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(uploadEvent) {
        tempLogoBase64 = uploadEvent.target.result;
        document.getElementById('logo-preview-container').innerHTML = `<img src="${tempLogoBase64}" class="w-full h-full object-cover">`;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('input-kop-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(uploadEvent) {
        tempKopBase64 = uploadEvent.target.result;
        document.getElementById('kop-preview-container').innerHTML = `<img src="${tempKopBase64}" class="w-full h-full object-contain">`;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('save-profile-btn').addEventListener('click', () => {
    const newProfil = {
      namaGuru: document.getElementById('input-nama-guru').value.trim(),
      nipGuru: document.getElementById('input-nip-guru').value.trim(),
      namaKepsek: document.getElementById('input-nama-kepsek').value.trim(),
      nipKepsek: document.getElementById('input-nip-kepsek').value.trim(),
      namaSekolah: document.getElementById('input-nama-sekolah').value.trim(),
      tahunAjaran: document.getElementById('input-tahun-ajaran').value.trim(),
      gasUrl: document.getElementById('gas-url-input').value.trim(),
      logoBase64: tempLogoBase64,
      kopBase64: tempKopBase64
    };

    StateManager.saveProfil(newProfil);

    if (newProfil.namaSekolah) document.getElementById('header-school-name').textContent = newProfil.namaSekolah;
    if (newProfil.namaGuru) document.getElementById('welcome-teacher-name').textContent = `Selamat Datang, ${newProfil.namaGuru}`;

    const notif = document.getElementById('status-profil');
    notif.classList.remove('hidden');
    setTimeout(() => notif.classList.add('hidden'), 2500);
  });

  document.getElementById('export-db-btn').addEventListener('click', () => {
    const currentState = StateManager.loadState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_aplikasi_guru_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  document.getElementById('import-db-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && typeof importedData === 'object') {
          localStorage.setItem('APLIKASI_GURU_STATE_V137', JSON.stringify(importedData));
          
          const statusEl = document.getElementById('status-import');
          statusEl.classList.remove('hidden');
          
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          alert('Format file JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file cadangan: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW Error:', err));
  }
});
