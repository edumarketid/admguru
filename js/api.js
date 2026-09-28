import { StateManager } from './state.js';

export const ApiService = {
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
