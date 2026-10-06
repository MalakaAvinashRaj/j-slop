(() => {
  const selector = '[componentkey^="update-card-focus"], .feed-shared-update-v2, .occludable-update';
  const textSelector = '[data-testid="expandable-text-box"], .update-components-text, .feed-shared-update-v2__description, .feed-shared-text';
  const states = new Map();
  // LinkedIn can replace card elements or change truncation when layout changes.
  // Keep one decision and the user's override per post identity for this page.
  const decisions = new Map();
  let settings = { enabled: true, threshold: 0.85 };
  let running = 0;
  let scheduled;
  let lastError = '';
  const indicator = document.createElement('div');
  indicator.className = 'jev-status';
  indicator.setAttribute('role', 'status');
  document.body.append(indicator);
  function updateStatus() {
    const checked = [...states.values()].filter(s => s.probability !== undefined).length;
    const hidden = [...states.keys()].filter(p => p.classList.contains('jev-collapsed')).length;
    const text = !settings.enabled ? 'J-Slop · Paused' : lastError ? `J-Slop · ${lastError}` : !states.size ? 'J-Slop · Waiting for posts' : `J-Slop · ${checked} checked · ${hidden} hidden${running ? ' · Checking…' : ''}`;
    if (indicator.textContent !== text) indicator.textContent = text;
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) { const state = states.get(entry.target); if (state) state.visible = entry.isIntersecting; }
    pump();
  }, { rootMargin: '200px' });

  function restore(post, state) {
    state.animation?.cancel();
    post.classList.remove('jev-collapsed');
    state.notice?.remove(); state.notice = null;
    state.badge?.remove(); state.badge = null;
    state.rendered = null;
  }
  function apply(post, state) {
    const enabled = settings.enabled && state.probability !== undefined;
    const collapsed = enabled && !state.revealed && (state.manualHide || state.probability >= settings.threshold);
    const signature = `${enabled}:${collapsed}:${state.revealed}:${state.manualHide}:${state.probability}`;
    const control = state.notice || state.badge;
    if (state.rendered === signature && (!enabled || control?.isConnected)) return;

    // Read before cancelling any in-flight transition, so rapid clicks reverse smoothly.
    const wasCollapsed = post.classList.contains('jev-collapsed');
    const fromHeight = post.getBoundingClientRect?.().height || 0;
    state.animation?.cancel();
    state.notice?.remove(); state.notice = null;
    state.badge?.remove(); state.badge = null;
    if (enabled) {
      const bar = document.createElement('div');
      bar.className = collapsed ? 'jev-notice' : 'jev-post-score';
      const label = document.createElement('span');
      label.textContent = collapsed ? 'Filtered by J-Slop' : state.revealed ? 'Shown by you' : `J-Slop · ${Math.round(state.probability * 100)}% slop`;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = collapsed ? 'Show post' : 'Hide post';
      button.setAttribute('aria-expanded', String(!collapsed));
      button.addEventListener('click', event => {
        event?.preventDefault(); event?.stopPropagation();
        state.revealed = collapsed; state.manualHide = !collapsed;
        apply(post, state); updateStatus();
      });
      bar.append(label, button);
      // Outside LinkedIn's rendered children: React cannot replace our button handlers.
      post.before(bar);
      if (collapsed) state.notice = bar; else state.badge = bar;
    }
    if (collapsed) post.classList.add('jev-collapsed'); else post.classList.remove('jev-collapsed');
    state.rendered = signature;
    if (wasCollapsed !== collapsed && post.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const toHeight = collapsed ? 0 : post.getBoundingClientRect().height;
      state.animation = post.animate([
        { height: `${fromHeight}px`, minHeight: '0px', opacity: wasCollapsed ? 0 : 1, overflow: 'hidden' },
        { height: `${toHeight}px`, minHeight: '0px', opacity: collapsed ? 0 : 1, overflow: 'hidden' }
      ], { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  }
  function discover() {
    for (const [post, state] of states) if (!post.isConnected) { state.animation?.cancel(); state.notice?.remove(); state.badge?.remove(); observer.unobserve(post); states.delete(post); }
    document.querySelectorAll(selector).forEach(post => {
      // Pick the outer card so nested LinkedIn wrappers are not classified twice.
      if (post.parentElement?.closest(selector)) return;
      const body = post.querySelector(textSelector);
      const copy = body?.cloneNode(true);
      copy?.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
      const text = copy?.textContent?.trim().slice(0, 12000);
      if (!text) return;
      const identity = post.getAttribute('componentkey') || post.getAttribute('data-urn') || text;
      let state = states.get(post);
      if (state?.identity === identity) {
        // Restore controls only if LinkedIn removed them; don't mutate on each scan.
        if (state.probability !== undefined && settings.enabled && !state.notice?.isConnected && !state.badge?.isConnected) apply(post, state);
        return;
      }
      if (state) restore(post, state);
      const decision = decisions.get(identity) || { revealed: false, manualHide: false };
      if (!decisions.has(identity)) {
        if (decisions.size >= 1000) decisions.delete(decisions.keys().next().value);
        decisions.set(identity, decision);
      }
      state = { text, identity, visible: false, retryAt: 0, decision };
      for (const key of ['probability', 'revealed', 'manualHide']) Object.defineProperty(state, key, { get: () => decision[key], set: value => { decision[key] = value; } });
      states.set(post, state);
      if (state.probability !== undefined) apply(post, state);
      observer.unobserve(post); observer.observe(post);
    });
    pump();
    updateStatus();
  }
  function pump() {
    if (!settings.enabled) return;
    for (const [post, state] of states) {
      if (running >= 2) break;
      if (!state.visible || state.pending || state.probability !== undefined || state.retryAt > Date.now()) continue;
      state.pending = true; running++;
      chrome.runtime.sendMessage({ type: 'classify', text: state.text }).then(result => {
        if (states.get(post) !== state || !post.isConnected) return;
        if (result?.error || typeof result?.probability !== 'number') { lastError = result?.error || 'Invalid decision'; state.retryAt = result?.error?.startsWith('Busy;') ? Date.now() + 30000 : Infinity; return; }
        lastError = '';
        state.probability = result.probability;
        apply(post, state);
      }).catch(() => { lastError = 'Reload LinkedIn to reconnect'; state.retryAt = Infinity; }).finally(() => { state.pending = false; running--; pump(); updateStatus(); });
    }
  }
  async function refreshSettings() {
    try {
      const next = await chrome.runtime.sendMessage({ type: 'settings' });
      if (!next || next.error) { lastError = next?.error || 'Extension unavailable'; updateStatus(); return; }
      const changed = settings.enabled !== next.enabled || settings.threshold !== next.threshold;
      settings = next;
      if (changed) for (const [post, state] of states) apply(post, state);
      discover();
    } catch { lastError = 'Reload LinkedIn to reconnect'; updateStatus(); }
  }
  refreshSettings();
  new MutationObserver(() => { clearTimeout(scheduled); scheduled = setTimeout(discover, 250); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(refreshSettings, 2000);
})();
