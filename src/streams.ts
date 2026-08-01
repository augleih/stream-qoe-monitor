import type { StreamDef } from './types.js';

// URL이 죽으면 note의 대체 URL로 교체하고 docs/decisions.md에 기록한다.
export const STREAMS: StreamDef[] = [
  {
    id: 'hls_vod', proto: 'hls', live: false,
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
    note: 'Apple bipbop, TS 컨테이너, 래더 232k~2M. Shaka에서 TS 재생 실패 시 fMP4 대체: https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
  },
  {
    id: 'dash_vod', proto: 'dash', live: false,
    url: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
    note: '대체: https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
  },
  {
    id: 'hls_live', proto: 'hls', live: true,
    url: 'https://demo.unified-streaming.com/k8s/live/stable/live.isml/.m3u8',
    note: 'Unified Streaming 데모 라이브 (Akamai 라이브 2종이 세그먼트 404로 사망해 교체). 대체: https://demo.unified-streaming.com/k8s/live/stable/scte35.isml/.m3u8',
  },
  {
    id: 'dash_live', proto: 'dash', live: true,
    url: 'https://livesim2.dashif.org/livesim2/testpic_2s/Manifest.mpd',
    note: 'DASH-IF livesim2 상시 시뮬레이터 (설계서의 Akamai 대신 선정 — 안정성). 대체: https://livesim2.dashif.org/livesim2/testpic_6s/Manifest.mpd (동일 호스트의 다른 자산 — 호스트 전체 장애 시에는 스트림 교체 필요)',
  },
];
