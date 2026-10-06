const enabled = document.getElementById('enabled');
const threshold = document.getElementById('threshold');
const value = document.getElementById('value');
chrome.storage.local.get({ enabled: true, threshold: 0.85 }).then(settings => {
  enabled.checked = settings.enabled; threshold.value = Math.round(settings.threshold * 100); value.textContent = `${threshold.value}%`;
});
enabled.addEventListener('change', () => chrome.storage.local.set({ enabled: enabled.checked }));
threshold.addEventListener('input', () => { value.textContent = `${threshold.value}%`; });
threshold.addEventListener('change', () => chrome.storage.local.set({ threshold: Number(threshold.value) / 100 }));
const status = document.getElementById('status');
async function refreshStatus() {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'health' });
    document.getElementById('calls').textContent = result.requests ?? 0;
    document.getElementById('limit').textContent = result.limit ?? 250;
    status.textContent = result.error || (result.ready ? 'Connected · Jev is ready' : 'Save your OpenRouter key to start filtering.');
  } catch { status.textContent = 'Reload the extension and try again.'; }
}
document.getElementById('keyForm').addEventListener('submit', async event => {
  event.preventDefault();
  const input = document.getElementById('apiKey');
  if (!input.value.trim()) { status.textContent = 'Enter your key first.'; return; }
  const result = await chrome.runtime.sendMessage({ type: 'saveKey', key: input.value });
  if (result.error) status.textContent = result.error; else { input.value = ''; refreshStatus(); }
});
document.getElementById('removeKey').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'saveKey', key: '' });
  refreshStatus();
});
refreshStatus();
