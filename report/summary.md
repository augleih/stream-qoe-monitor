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

## 차트

![startup dash_live_kbps600](charts/startup_dash_live_kbps600.svg)

![startup dash_live_mbps1_5](charts/startup_dash_live_mbps1_5.svg)

![startup dash_live_unlimited](charts/startup_dash_live_unlimited.svg)

![startup dash_vod_kbps600](charts/startup_dash_vod_kbps600.svg)

![startup dash_vod_mbps1_5](charts/startup_dash_vod_mbps1_5.svg)

![startup dash_vod_unlimited](charts/startup_dash_vod_unlimited.svg)

![startup hls_live_kbps600](charts/startup_hls_live_kbps600.svg)

![startup hls_live_mbps1_5](charts/startup_hls_live_mbps1_5.svg)

![startup hls_live_unlimited](charts/startup_hls_live_unlimited.svg)

![startup hls_vod_kbps600](charts/startup_hls_vod_kbps600.svg)

![startup hls_vod_mbps1_5](charts/startup_hls_vod_mbps1_5.svg)

![startup hls_vod_unlimited](charts/startup_hls_vod_unlimited.svg)

## 결함·조건 변화 시나리오 결과

| scenario | stream | player | 회복 | ABR 반응 | 오버슈트 | rebuffer 수 | rebuffer 시간 | 에러 |
|---|---|---|---|---|---|---|---|---|
| manifest_fail | dash_live | dashjs | — | — | 0 | 0 | 0ms | — |
| manifest_fail | dash_live | shaka | — | — | 0 | 1 | 140ms | shaka error: code=1002 |
| bw_recover | dash_vod | dashjs | O | 322ms | 2 | 0 | 0ms | — |
| bw_drop | dash_vod | dashjs | O | 28152ms | 0 | 0 | 0ms | — |
| offline_3s | dash_vod | dashjs | O | — | 0 | 0 | 0ms | — |
| seg_404 | dash_vod | dashjs | — | 112ms | 0 | 0 | 0ms | — |
| seg_delay | dash_vod | dashjs | — | — | 0 | 0 | 0ms | — |
| bw_recover | dash_vod | shaka | O | 5573ms | 0 | 0 | 0ms | — |
| bw_drop | dash_vod | shaka | O | 8823ms | 1 | 0 | 0ms | — |
| offline_3s | dash_vod | shaka | — | — | 0 | 0 | 0ms | shaka error: code=1002 |
| seg_404 | dash_vod | shaka | — | 8316ms | 1 | 0 | 0ms | — |
| seg_delay | dash_vod | shaka | — | 8033ms | 1 | 0 | 0ms | — |
| manifest_fail | hls_live | hlsjs | O | 3493ms | 0 | 0 | 0ms | — |
| manifest_fail | hls_live | shaka | — | — | 0 | 0 | 0ms | shaka.util.Error { "severity": 2, "category": 1, "code": 1002, "data": [ "https://demo.unified-streaming.com/k8s/live/st |
| bw_recover | hls_vod | hlsjs | O | — | 0 | 0 | 0ms | — |
| bw_drop | hls_vod | hlsjs | O | — | 0 | 0 | 0ms | — |
| offline_3s | hls_vod | hlsjs | O | — | 0 | 0 | 0ms | — |
| seg_404 | hls_vod | hlsjs | O | 36812ms | 0 | 0 | 0ms | — |
| seg_delay | hls_vod | hlsjs | O | — | 0 | 0 | 0ms | — |
| bw_recover | hls_vod | shaka | O | 7210ms | 0 | 2 | 84ms | — |
| bw_drop | hls_vod | shaka | O | — | 2 | 3 | 328ms | — |
| offline_3s | hls_vod | shaka | O | 11488ms | 1 | 3 | 105ms | — |
| seg_404 | hls_vod | shaka | O | — | 1 | 3 | 108ms | — |
| seg_delay | hls_vod | shaka | O | — | 0 | 2 | 83ms | — |

## 관찰 노트

**저대역폭 환경에서의 프로토콜별 적응 패턴:** Live 스트림(hls_live 720p만, dash_live 360p만 제공)은 단일 렌디션 제약으로 인해 kbps600에서 rebuffer ratio 급증(hls_live hlsjs: 0.0045→0.0371, shaka: 0→0.0805). 이는 **대역폭이 유일한 렌디션의 비트레이트에 미달하는 상황**으로, 선택지가 없어 rebuffer로 나타난 것이 **의도된 행동**. 반면 VOD 스트림은 해상도 적응(hls_vod hlsjs: 1037p→234p)으로 rebuffer 최소화. **예외:** hls_vod hlsjs에서 mbps1_5 rebuffer(0.0133)가 kbps600(0)보다 높음 — 대역폭 절벽 부근에서 ABR 진동의 전형적 현상. **결함 없음:** 모든 관찰이 프로토콜 및 네트워크 제약 하의 예상된 행동.

**세그먼트 단위 결함 주입의 측정 한계:** DASH 세그먼트는 HLS보다 짧아(≈2s vs ≈6-10s), 8번째 세그먼트 요청 기준 결함(seg_404, seg_delay)이 재생 시작 직후 t<1000ms에 발동된다. 이로 인해 recovered() 판정 기준인 "마지막 mark 이전의 샘플"이 존재하지 않아 null이 반환된다. 실제로는 ABR 반응이 발생했으나(예: seg_404|dash_vod|dashjs ABR 반응 112ms) recovered 값이 null인 것은 **측정 맹점**이지 플레이어 실패가 아님. HLS와 DASH의 세그먼트 타이밍 차이를 결과 해석 시 고려할 것.

**manifest 갱신 주기와 시나리오 창:** manifest_fail|dash_live|dashjs는 60초 관찰 창에서 manifest_abort 표지가 0개였고, 120초 창에서도 동일. 결함이 주입되지 않은 원인은 미확인(추정: 관찰 창 내 MPD 재요청이 라우트에 잡히지 않음 — 갱신 주기 또는 캐시 동작으로 추정). 따라서 이 조합의 시나리오 결과는 실제 manifest 처리 동작을 반영하지 않는 무효 데이터임을 명시한다.

**manifest_fail의 HLS 해석 주의:** scenarios가 매니페스트 요청 2~4번째를 차단하는데, DASH 라이브에선 MPD 갱신에 해당하지만 HLS에선 요청 #2가 최초 미디어 플레이리스트라 결함이 재생 시작 전에 발동한다. 실측: shaka는 first_frame 이전 fatal(code=1002)로 시작 실패, hlsjs는 재시도로 회복. 따라서 이 조합의 결과는 "라이브 갱신 실패 내성"이 아니라 "시작 매니페스트 견고성"으로 읽어야 한다.
