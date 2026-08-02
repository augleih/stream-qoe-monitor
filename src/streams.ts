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
    url: 'https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/avc-full.m3u8',
    note: 'BBC R&D 테스트카드 시뮬캐스트, 9단계 래더(108p~1080p), fMP4 3.84s. 301→akamaized. 대체(직결): https://vs-hls-ww-rd-live.akamaized.net/pl/testcard2020/avc-full.m3u8',
  },
  {
    id: 'dash_live', proto: 'dash', live: true,
    url: 'https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/avc-full.mpd',
    note: 'BBC R&D 테스트카드 시뮬캐스트 DASH, 동일 래더. 대체(직결): https://vs-dash-ww-rd-live.akamaized.net/pl/testcard2020/avc-full.mpd',
  },
];
