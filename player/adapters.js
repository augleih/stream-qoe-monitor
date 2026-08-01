window.__players = {
  hlsjs: {
    version: () => Hls.version,
    load(video, src, onSwitch) {
      const hls = new Hls();
      hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
        const lvl = hls.levels[data.level];
        onSwitch({ height: lvl ? lvl.height : null, bitrate: lvl ? lvl.bitrate : null });
      });
      hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) window.__qoe.fail('hls.js fatal: ' + data.type + '/' + data.details);
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    },
  },

  dashjs: {
    version: () => dashjs.Version,
    load(video, src, onSwitch) {
      const p = dashjs.MediaPlayer().create();
      p.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, e => {
        // v5: e.newRepresentation / v4: e.newQuality(인덱스) — 둘 다 대응
        const rep = e.newRepresentation;
        onSwitch(rep
          ? { height: rep.height ?? null, bitrate: rep.bandwidth ?? null }
          : { height: null, bitrate: null, level: e.newQuality ?? null });
      });
      p.on(dashjs.MediaPlayer.events.ERROR, e => {
        window.__qoe.fail('dash.js error: ' + JSON.stringify(e.error).slice(0, 200));
      });
      p.initialize(video, src, true);
    },
  },

  shaka: {
    version: () => shaka.Player.version,
    async load(video, src, onSwitch) {
      shaka.polyfill.installAll();
      const p = new shaka.Player();
      await p.attach(video);
      p.addEventListener('adaptation', () => {
        const active = p.getVariantTracks().find(t => t.active);
        onSwitch(active
          ? { height: active.height ?? null, bitrate: active.bandwidth ?? null }
          : { height: null, bitrate: null });
      });
      p.addEventListener('error', e => {
        window.__qoe.fail('shaka error: code=' + (e.detail && e.detail.code));
      });
      await p.load(src);
    },
  },
};
