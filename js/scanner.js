import { StateManager } from './state.js';

export const ScannerModule = {
  init(onAttendanceRecorded) {
    const modal = document.getElementById('qr-modal');
    const openBtn = document.getElementById('open-scanner-btn');
    const closeBtn = document.getElementById('close-scanner-btn');
    const resultNotice = document.getElementById('scan-result-notice');

    if (!modal) return;

    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      if (resultNotice) resultNotice.textContent = 'Arahkan kamera ke QR Code Kartu Siswa...';
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    window.handleScannedId = (idSiswa) => {
      const state = StateManager.loadState();
      const siswa = state.siswa.find(s => s.idSiswa === idSiswa);
      const today = new Date().toISOString().slice(0, 10);

      if (siswa) {
        const sudahAbsen = state.kehadiran.some(k => k.idSiswa === idSiswa && k.tanggal === today);
        if (sudahAbsen) {
          if (resultNotice) resultNotice.innerHTML = `<span class="text-amber-600 font-bold">${siswa.nama} (${idSiswa}) sudah tercatat hadir hari ini!</span>`;
          return;
        }

        state.kehadiran.push({
          tanggal: today,
          idSiswa: siswa.idSiswa,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas,
          status: 'Hadir',
          catatan: 'Scan QR Code'
        });

        StateManager.saveState(state);
        if (resultNotice) {
          resultNotice.innerHTML = `<span class="text-emerald-600 font-bold">Berhasil! ${siswa.nama} (${idSiswa}) Hadir ✓</span>`;
        }
        
        if (typeof onAttendanceRecorded === 'function') {
          onAttendanceRecorded(siswa);
        }
      } else {
        if (resultNotice) {
          resultNotice.innerHTML = `<span class="text-rose-600 font-bold">ID ${idSiswa} tidak ditemukan di database!</span>`;
        }
      }
    };
  }
};
