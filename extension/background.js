import { requestFor, probabilityFrom, excerptFor, CACHE_VERSION, DAILY_LIMIT } from './decision.mjs';
const storageReady = chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).then(async () => {
  const all = await chrome.storage.local.get(null);
  const entries = Object.entries(all).filter(([key]) => key.startsWith('decision:')).sort((a, b) => b[1].expires - a[1].expires);
  const remove = entries.filter(([, value], index) => index >= 1000 || value.expires <= Date.now()).map(([key]) => key);
  if (remove.length) await chrome.storage.local.remove(remove);
});
const cache = new Map();
const pending = new Map();
let budgetLock = Promise.resolve();
async function reserveRequest() {
  const task = budgetLock.then(async () => {
    const day = new Date().toISOString().slice(0, 10);
    const stored = await chrome.storage.local.get({ spending: {} });
    const spending = stored.spending.day === day ? stored.spending : { day, requests: 0 };
    if (spending.requests >= DAILY_LIMIT) throw new Error(`Daily cost limit reached (${DAILY_LIMIT} requests). Resumes tomorrow UTC.`);
    spending.requests++;
    await chrome.storage.local.set({ spending });
  });
  budgetLock = task.catch(() => {});
  return task;
}
let active = 0;
let lastError = '';
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  const popup = sender.id === chrome.runtime.id && sender.url === chrome.runtime.getURL('popup.html');
  if (!['classify', 'health', 'settings', 'saveKey'].includes(message.type)) return;
  if (['health', 'saveKey'].includes(message.type) && !popup) return;
  if (message.type === 'classify' && !sender.tab?.url?.startsWith('https://www.linkedin.com/')) return;
  (async () => {
    try {
      await storageReady;
      const settings = await chrome.storage.local.get({ enabled: true, threshold: 0.85, apiKey: '' });
      if (message.type === 'settings') { respond({ enabled: settings.enabled, threshold: settings.threshold }); return; }
      if (message.type === 'health') { const { spending } = await chrome.storage.local.get({ spending: {} }); respond({ ready: Boolean(settings.apiKey), requests: spending.day === new Date().toISOString().slice(0, 10) ? spending.requests : 0, limit: DAILY_LIMIT, error: settings.apiKey && !/^[\x21-\x7E]+$/.test(settings.apiKey) ? 'Saved key contains invalid characters. Copy the plain API key from OpenRouter and save it again.' : lastError }); return; }
      if (message.type === 'saveKey') {
        if (typeof message.key !== 'string') throw new Error('Invalid key');
        if (message.key.trim() && !/^sk-or-v1-[A-Za-z0-9_-]+$/.test(message.key.trim())) throw new Error('Paste only the OpenRouter API key, starting with sk-or-v1-. Do not include quotes or other text.');
        await chrome.storage.local.set({ apiKey: message.key.trim() }); cache.clear(); lastError = ''; respond({ saved: true }); return;
      }
      if (!settings.enabled) throw new Error('Filtering paused');
      if (!settings.apiKey) throw new Error('Save your OpenRouter key in the popup');
      if (!/^[\x21-\x7E]+$/.test(settings.apiKey)) throw new Error('Saved key has invalid characters. Paste the plain OpenRouter key again.');
      if (typeof message.text !== 'string' || !message.text.trim() || message.text.length > 12000) throw new Error('Invalid post');
      const excerpt = excerptFor(message.text);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(CACHE_VERSION + excerpt))), n => n.toString(16).padStart(2, '0')).join('');
      if (cache.has(hash)) { respond(cache.get(hash)); return; }
      if (pending.has(hash)) { respond(await pending.get(hash)); return; }
      const stored = await chrome.storage.local.get(`decision:${hash}`);
      if (pending.has(hash)) { respond(await pending.get(hash)); return; }
      if (stored[`decision:${hash}`]?.expires > Date.now()) { const result = { probability: stored[`decision:${hash}`].probability }; cache.set(hash, result); respond(result); return; }
      if (active >= 3) throw new Error('Busy; retrying shortly');
      active++;
      const task = (async () => {
        await reserveRequest();
        const response = await fetch('https://openrouter.ai/api/v1/systemone', {
          method: 'POST', headers: { Authorization: `Bearer ${settings.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(requestFor(excerpt)), signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const detail = typeof data?.error?.message === 'string' ? data.error.message.replaceAll(settings.apiKey, '[redacted]').slice(0, 240) : 'Check your key, credits, or service availability.';
          throw new Error(`OpenRouter ${response.status}: ${detail}`);
        }
        const result = { probability: probabilityFrom(await response.json()) };
        if (cache.size >= 1000) cache.delete(cache.keys().next().value);
        cache.set(hash, result); lastError = '';
        await chrome.storage.local.set({ [`decision:${hash}`]: { ...result, expires: Date.now() + 30 * 86400000 } });
        return result;
      })();
      pending.set(hash, task);
      try { respond(await task); } finally { active--; pending.delete(hash); }
    } catch (error) { lastError = error.message || 'Could not classify post'; respond({ error: lastError }); }
  })();
  return true;
});
