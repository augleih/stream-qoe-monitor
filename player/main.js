(async () => {
  const q = new URLSearchParams(location.search);
  const playerName = q.get('player');
  const src = q.get('src');
  const observeMs = parseInt(q.get('observe') || '60000', 10);
  const video = document.getElementById('video');
  const adapter = window.__players[playerName];
  if (!adapter || !src) {
    window.__qoe.fail('invalid params: player=' + playerName + ' src=' + src);
    return;
  }
  window.__qoe.setMeta({ player: playerName, libVersion: adapter.version() });
  window.__qoe.start(video, observeMs);
  const cmcdOpts = q.get('cmcd') === '1'
    ? { sessionId: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), contentId: src.slice(-64) }
    : null;
  try {
    await adapter.load(video, src, sw => window.__qoe.onSwitch(sw), cmcdOpts);
    await video.play().catch(() => {});
  } catch (err) {
    window.__qoe.fail(String(err));
  }
})();
