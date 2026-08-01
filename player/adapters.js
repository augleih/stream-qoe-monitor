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
};
