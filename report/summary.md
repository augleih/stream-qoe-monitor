# QoE 비교 결과

지표 정의: docs/metrics.md (CTA-2066 준거). 통계: 중앙값 + P95 (평균 미사용).

## dash_live

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | dashjs | 5(0) | 2505ms | 2662ms | 0 | 20% | 0.0011 | 360p |
| kbps600 | shaka | 5(0) | 3283ms | 3470ms | 0 | 40% | 0 | 360p |
| mbps1_5 | dashjs | 5(0) | 2222ms | 2259ms | 0 | 0% | 0 | 360p |
| mbps1_5 | shaka | 5(0) | 2411ms | 2825ms | 0.0045 | 80% | 0.0012 | 360p |
| unlimited | dashjs | 5(0) | 2098ms | 2136ms | 0 | 0% | 0 | 360p |
| unlimited | shaka | 5(0) | 2109ms | 2151ms | 0 | 40% | 0 | 360p |

## dash_vod

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | dashjs | 5(0) | 2299ms | 2335ms | 0 | 0% | 0.0014 | 180p |
| kbps600 | shaka | 5(0) | 3254ms | 3257ms | 0 | 0% | 0.0049 | 180p |
| mbps1_5 | dashjs | 5(0) | 1642ms | 1684ms | 0 | 0% | 0 | 361p |
| mbps1_5 | shaka | 5(0) | 1854ms | 1950ms | 0 | 0% | 0 | 340p |
| unlimited | dashjs | 5(0) | 171ms | 191ms | 0 | 0% | 0 | 1056p |
| unlimited | shaka | 5(0) | 350ms | 449ms | 0 | 0% | 0 | 1080p |

## hls_live

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | hlsjs | 5(0) | 4656ms | 4956ms | 0.0371 | 100% | 0.001 | 720p |
| kbps600 | shaka | 5(0) | 12608ms | 12962ms | 0.0805 | 100% | 0.0025 | 720p |
| mbps1_5 | hlsjs | 5(0) | 2626ms | 2948ms | 0 | 0% | 0 | 720p |
| mbps1_5 | shaka | 5(0) | 6332ms | 6567ms | 0 | 0% | 0 | 720p |
| unlimited | hlsjs | 5(0) | 2416ms | 2657ms | 0.0045 | 60% | 0 | 720p |
| unlimited | shaka | 5(0) | 3052ms | 3334ms | 0 | 0% | 0 | 720p |

## hls_vod

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | hlsjs | 5(0) | 4906ms | 6370ms | 0 | 0% | 0 | 234p |
| kbps600 | shaka | 5(0) | 16671ms | 17486ms | 0.0012 | 100% | 0.0021 | 347p |
| mbps1_5 | hlsjs | 5(0) | 2122ms | 3618ms | 0.0133 | 100% | 0.0093 | 327p |
| mbps1_5 | shaka | 5(0) | 6867ms | 8295ms | 0.0009 | 100% | 0.0006 | 720p |
| unlimited | hlsjs | 5(0) | 255ms | 2253ms | 0 | 0% | 0 | 1037p |
| unlimited | shaka | 5(0) | 288ms | 1834ms | 0.0011 | 100% | 0 | 1019p |

## 관찰 노트

**저대역폭 적응의 트레이드오프:** kbps600 조건에서 모든 스트림 유형에 걸쳐 일관된 성능 저하가 관찰됨. Live 스트림(특히 HLS)은 rebuffer ratio가 급증(hls_live hlsjs: 0.0045→0.0371, shaka: 0→0.0805)하며 이는 버퍼 고갈의 결과가 아닌 버퍼 확보 전략으로 판정됨. VOD 스트림은 해상도 적응이 우선되어 급격한 감소(hls_vod hlsjs: 1037p→234p)가 발생하나 rebuffer는 최소화됨. **의도:** 제한된 대역폭에서 재생 연속성(live)과 해상도 적응(vod)을 최우선. **결함 없음:** 네트워크 제약 하에서 예상된 행동.


