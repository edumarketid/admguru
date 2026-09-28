import { StateManager } from './state.js';

export const ApiService = {
  // 1. Tarik Data dari Spreadsheet (GET)
  async fetchFromCloud() {
    const gasUrl = StateManager.getGasUrl();
    if (!gasUrl || !gasUrl.startsWith('https://script.google.com')) {
      return false;
    }

    try {
      const response = await fetch(gasUrl);
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.appState) {
        // Timpa / perbarui state lokal dengan data terbaru dari Spreadsheet
        StateManager.saveState(result.data.appState);
        return true;
      }
    } catch (err) {
      console.error('Gagal menarik data dari cloud:', err);
    }
    return false;
  },

  // 2. Kirim Data ke Spreadsheet (POST)
  async syncToCloud() {
    const gasUrl = StateManager.getGasUrl();
    if (!gasUrl || !gasUrl.startsWith('https://script.google.com')) {
      throw new Error('URL GAS belum diatur.');
    }

    const stateData = StateManager.loadState();
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(stateData)
    });

    const result = await response.json();
    return result;
  }
};
