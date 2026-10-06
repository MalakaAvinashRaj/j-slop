import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('layout text changes and replacement cards retain one decision and user override', async () => {
  class Element {
    constructor(text = '') { this.textContent = text; this.children = []; this.isConnected = true; this.classes = new Set(); this.classList = { add: c => this.classes.add(c), remove: c => this.classes.delete(c), contains: c => this.classes.has(c) }; this.listeners = {}; }
    append(...children) { this.children.push(...children); }
    prepend(child) { this.children.unshift(child); }
    before(child) { this.children.unshift(child); }
    remove() { this.isConnected = false; }
    setAttribute() {}
    addEventListener(name, fn) { this.listeners[name] = fn; }
    getAttribute() { return 'update-card-focus-stable-post'; }
    querySelector() { return this.body; }
    cloneNode() { return new Element(this.textContent); }
    querySelectorAll() { return []; }
  }
  let card = new Element(); card.body = new Element('Original full post'); card.parentElement = { closest: () => null };
  let scan; let mutations; let requests = 0;
  const context = {
    document: { body: new Element(), createElement: () => new Element(), querySelectorAll: () => [card] },
    IntersectionObserver: class { constructor(fn) { this.fn = fn; } observe(post) { this.fn([{ target: post, isIntersecting: true }]); } unobserve() {} },
    MutationObserver: class { constructor(fn) { mutations = fn; } observe() {} },
    setInterval: fn => { scan = fn; }, setTimeout: fn => fn(), clearTimeout() {},
    chrome: { runtime: { sendMessage: async msg => { if (msg.type === 'settings') return { enabled: true, threshold: 0.8 }; requests++; return { probability: 0.81 }; } } }
  };
  vm.runInNewContext(readFileSync('extension/content.js', 'utf8'), context);
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  await settle();
  assert.equal(requests, 1); assert.equal(card.classList.contains('jev-collapsed'), true);
  card.body.textContent = 'Original full post… more'; mutations(); await scan(); await settle();
  assert.equal(requests, 1); assert.equal(card.classList.contains('jev-collapsed'), true);
  const notice = card.children.find(e => e.className === 'jev-notice' && e.isConnected);
  notice.children[1].listeners.click();
  assert.equal(card.classList.contains('jev-collapsed'), false);
  card.isConnected = false;
  card = new Element(); card.body = new Element('Original full post'); card.parentElement = { closest: () => null };
  await scan(); await settle();
  assert.equal(requests, 1); assert.equal(card.classList.contains('jev-collapsed'), false);
  assert.ok(card.children.some(e => e.className === 'jev-post-score'));
});
