import { StateManager } from './state.js';

export const ScannerModule = {
  init(onAttendanceRecorded) {
    const modal = document.getElementById('qr-modal');
    const openBtn = document.getElementById('open-scanner-btn');
    const closeBtn = document.getElementById('close-scanner-btn');
    const switchCamBtn = document.getElementById('switch-camera-btn');
    const camFacingText = document.getElementById('cam-facing-text');
    const resultNotice = document.getElementById('scan-result-notice');

    if (!modal) return;

    let html5QrCode = null;
    let useFrontCamera = false; // Default menggunakan kamera belakang (environment)

    const startScanner = async () => {
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
      }

      const cameraConfig = useFrontCamera ? { facingMode: "user" } : { facingMode: "environment" };
      if (camFacingText) camFacingText.textContent = useFrontCamera ? "Depan" : "Belakang";

      try {
        await html5QrCode.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: { width: 200, height: 200 }
          },
          (decodedText) => {
            // Berhasil memindai QR Code (mengambil string ID, misal 'S001')
            window.handleScannedId(decodedText.trim());
          },
          (errorMessage) => {
            // Abaikan error frame kosong saat mencari QR
          }
        );
      } catch (err) {
        console.error("Gagal membuka kamera:", err);
        if (resultNotice) {
          resultNotice.innerHTML = `<span class="text-rose-600 font-bold">Kamera gagal diakses. Gunakan tombol simulasi di bawah.</span>`;
        }
      }
    };

    const stopScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          await html5QrCode.stop();
          await html5QrCode.clear();
        } catch (err) {
          console.error("Gagal menghentikan kamera:", err);
        }
      }
    };

    // Tombol Buka Modal & Nyalakan Kamera
    openBtn.addEventListener('click', async () => {
      modal.classList.remove('hidden');
      if (resultNotice) resultNotice.textContent = 'Menyalakan kamera...';
      await startScanner();
    });

    // Tombol Tutup Modal & Matikan Kamera
    closeBtn.addEventListener('click', async () => {
      await stopScanner();
      modal.classList.add('hidden');
    });

    // Saklar Ganti Kamera (Depan / Belakang)
    switchCamBtn.addEventListener('click', async () => {
      useFrontCamera = !useFrontCamera;
      await stopScanner();
      await startScanner();
    });

    // Fungsi Global Pemrosesan ID Siswa yang Berhasil Ter-scan
    window.handleScannedId = (idSiswa) => {
      const state = StateManager.loadState();
      const siswa = state.siswa.find(s => s.idSiswa === idSiswa);
      const today = new Date().toISOString().slice(0, 10);

      if (siswa) {
        const sudahAbsen = state.kehadiran.some(k => k.idSiswa === idSiswa && k.tanggal === today);
        if (sudahAbsen) {
          if (resultNotice) resultNotice.innerHTML = `<span class="text-amber-600 font-bold">${siswa.nama} (${idSiswa}) sudah tercatat hadir!</span>`;
          return;
        }

        state.kehadiran.push({
          tanggal: today,
          idSiswa: siswa.idSiswa,
          nis: siswa.nis,
          nama: siswa.nama,
          kelas: siswa.kelas,
          status: 'Hadir',
          catatan: 'Scan QR Code Kamera'
        });

        StateManager.saveState(state);
        if (resultNotice) {
          resultNotice.innerHTML = `<span class="text-emerald-600 font-bold">Sukses! ${siswa.nama} (${idSiswa}) Hadir ✓</span>`;
        }
        
        if (typeof onAttendanceRecorded === 'function') {
          onAttendanceRecorded(siswa);
        }
      } else {
        if (resultNotice) {
          resultNotice.innerHTML = `<span class="text-rose-600 font-bold">ID ${idSiswa} tidak terdaftar di database!</span>`;
        }
      }
    };
  }
};
