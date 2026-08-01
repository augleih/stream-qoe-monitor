window.__qoe = (() => {
  const S = {
    t0: null, meta: {}, timeline: [], samples: [], rebuffers: [],
    metadataAt: null, firstFrameAt: null, stall: null,
    error: null, done: false, observeMs: 60000,
  };
  const now = () => performance.now();
  const rel = t => Math.round(t - S.t0);
  const ev = (type, detail) => S.timeline.push(
    detail === undefined ? { t: rel(now()), type } : { t: rel(now()), type, detail });

  function start(video, observeMs) {
    performance.setResourceTimingBufferSize(20000);
    S.observeMs = observeMs;
    S.t0 = now();
    ev('t0');

    video.addEventListener('loadedmetadata', () => {
      if (S.metadataAt === null) { S.metadataAt = now(); ev('loadedmetadata'); }
    });

    // 첫 프레임 이전의 waiting은 초기 버퍼링 — rebuffer 집계 제외
    video.addEventListener('waiting', () => {
      if (S.firstFrameAt === null) { ev('waiting_initial'); return; }
      if (!S.stall) { S.stall = { start: now() }; ev('stall_start'); }
    });
    const resume = () => {
      if (S.stall) {
        const dur = now() - S.stall.start;
        S.rebuffers.push(dur);
        ev('stall_end', Math.round(dur));
        S.stall = null;
      }
    };
    video.addEventListener('playing', resume);
    video.addEventListener('timeupdate', resume);

    video.addEventListener('error', () => {
      S.error = video.error ? 'MediaError code=' + video.error.code : 'media error';
      ev('media_error', S.error);
    });

    video.requestVideoFrameCallback(() => { S.firstFrameAt = now(); ev('first_frame'); });

    const sampler = setInterval(() => {
      let buf = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime &&
            video.currentTime <= video.buffered.end(i) + 0.1) {
          buf = video.buffered.end(i) - video.currentTime;
        }
      }
      const q = video.getVideoPlaybackQuality();
      S.samples.push({
        t: rel(now()),
        ct: Math.round(video.currentTime * 100) / 100,
        buffer_s: Math.round(buf * 100) / 100,
        height: video.videoHeight,
        dropped: q.droppedVideoFrames,
        decoded: q.totalVideoFrames,
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(sampler);
      if (S.stall) {
        const dur = now() - S.stall.start;
        S.rebuffers.push(dur);
        ev('stall_open_at_end', Math.round(dur));
        S.stall = null;
      }
      ev('observe_end');
      S.done = true;
    }, observeMs);
  }

  function setMeta(meta) { S.meta = meta; }
  function mark(name) { ev('mark', name); }
  function onSwitch(sw) { ev('quality_switch', sw); }
  function fail(msg) {
    if (S.t0 === null) S.t0 = now();
    S.error = String(msg);
    ev('fatal', S.error);
    S.done = true;
  }

  function firstEntryMs(pathRegex) {
    const es = performance.getEntriesByType('resource')
      .filter(e => pathRegex.test(e.name.split('?')[0]) && e.responseEnd >= S.t0)
      .sort((a, b) => a.responseEnd - b.responseEnd);
    return es.length ? Math.round(es[0].responseEnd - S.t0) : null;
  }

  function result() {
    const manifest = firstEntryMs(/\.(m3u8|mpd)$/);
    const firstSeg = firstEntryMs(/\.(ts|mp4|m4s|m4a|m4v|cmfv|cmfa|aac)$/);
    const metadata = S.metadataAt === null ? null : Math.round(S.metadataAt - S.t0);
    const firstFrame = S.firstFrameAt === null ? null : Math.round(S.firstFrameAt - S.t0);
    const stallTime = Math.round(S.rebuffers.reduce((a, b) => a + b, 0));
    const playWindow = S.firstFrameAt === null ? null : S.observeMs - (S.firstFrameAt - S.t0);
    const last = S.samples[S.samples.length - 1];

    const post = S.samples.filter(s => firstFrame !== null && s.t >= firstFrame && s.height > 0);
    let twh = null;
    if (post.length > 1) {
      let acc = 0, dur = 0;
      for (let i = 1; i < post.length; i++) {
        const dt = post[i].t - post[i - 1].t;
        acc += post[i - 1].height * dt;
        dur += dt;
      }
      twh = Math.round(acc / dur);
    }

    return {
      meta: S.meta,
      metrics: {
        manifest_loaded_ms: manifest,
        first_segment_ms: firstSeg,
        metadata_ms: metadata,
        first_frame_ms: firstFrame,
        startup_ms: firstFrame,
        breakdown: {
          manifest,
          to_first_segment: manifest !== null && firstSeg !== null ? firstSeg - manifest : null,
          to_metadata: firstSeg !== null && metadata !== null ? metadata - firstSeg : null,
          to_first_frame: metadata !== null && firstFrame !== null ? firstFrame - metadata : null,
        },
        rebuffer_count: S.rebuffers.length,
        rebuffer_time_ms: stallTime,
        rebuffer_ratio: playWindow ? Math.round((stallTime / playWindow) * 10000) / 10000 : null,
        dropped_ratio: last && last.decoded > 0
          ? Math.round((last.dropped / last.decoded) * 10000) / 10000 : null,
        time_weighted_height: twh,
      },
      timeline: S.timeline,
      samples: S.samples,
      error: S.error,
    };
  }

  return { start, setMeta, mark, onSwitch, fail, result, isDone: () => S.done };
})();
