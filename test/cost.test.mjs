import { test } from 'node:test';
import assert from 'node:assert/strict';

test('duplicate calls, worker restarts, and daily cap avoid extra API spending', async () => {
  const previousChrome = globalThis.chrome, previousFetch = globalThis.fetch;
  const data = { apiKey: 'sk-or-v1-test', enabled: true };
  let listener, calls = 0;
  const sender = { id: 'test', tab: { url: 'https://www.linkedin.com/feed/' } };
  globalThis.chrome = { runtime: { id: 'test', getURL: p => `chrome-extension://test/${p}`, onMessage: { addListener: fn => { listener = fn; } } }, storage: { local: {
    setAccessLevel: async () => {},
    get: async keys => keys === null ? { ...data } : typeof keys === 'string' ? { [keys]: data[keys] } : Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, data[k] ?? v])),
    set: async values => { Object.assign(data, values); },
    remove: async keys => { for (const key of keys) delete data[key]; }
  } } };
  globalThis.fetch = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return { ok: true, json: async () => ({ answers: { slop: { noul: 0.9 } } }) }; };
  const classify = text => new Promise(resolve => listener({ type: 'classify', text }, sender, resolve));
  try {
    await import('../extension/background.js?cost-test-first');
    const results = await Promise.all([classify('Same post'), classify('Same post')]);
    assert.equal(calls, 1); assert.equal(results[0].probability, 0.9); assert.equal(results[1].probability, 0.9);
    await import('../extension/background.js?cost-test-restarted');
    assert.equal((await classify('Same post')).probability, 0.9); assert.equal(calls, 1);
    data.spending = { day: new Date().toISOString().slice(0, 10), requests: 250 };
    assert.match((await classify('New unseen post')).error, /Daily cost limit/); assert.equal(calls, 1);
  } finally { globalThis.chrome = previousChrome; globalThis.fetch = previousFetch; }
});
