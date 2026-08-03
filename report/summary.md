# QoE 비교 결과

지표 정의: docs/metrics.md (CTA-2066 준거). 통계: 중앙값 + P95 (평균 미사용).

## dash_live

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | dashjs | 5(0) | 6098ms | 8338ms | 0 | 0% | 0.0564 | 126p |
| kbps600 | shaka | 5(0) | 7117ms | 7363ms | 0.0048 | 100% | 0.0334 | 132p |
| mbps1_5 | dashjs | 5(0) | 4447ms | 6047ms | 0 | 0% | 0.0148 | 221p |
| mbps1_5 | shaka | 5(0) | 4356ms | 5979ms | 0 | 20% | 0.0059 | 203p |
| unlimited | dashjs | 5(0) | 1800ms | 4231ms | 0 | 0% | 0.0164 | 274p |
| unlimited | shaka | 5(0) | 4600ms | 11848ms | 0 | 0% | 0.007 | 161p |

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
| kbps600 | hlsjs | 5(0) | 12352ms | 18404ms | 0.0052 | 80% | 0 | 143p |
| kbps600 | shaka | 5(0) | 14572ms | 18404ms | 0 | 0% | 0 | 108p |
| mbps1_5 | hlsjs | 5(0) | 9682ms | 15013ms | 0 | 40% | 0.0341 | 270p |
| mbps1_5 | shaka | 5(0) | 10223ms | 11297ms | 0 | 0% | 0 | 167p |
| unlimited | hlsjs | 5(0) | 3476ms | 24651ms | 0.0048 | 100% | 0.0139 | 402p |
| unlimited | shaka | 5(0) | 12029ms | 15342ms | 0.0105 | 60% | 0.013 | 456p |

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

## 결함·조건 변화 시나리오 결과 (반복 집계)

트리거는 재생 위치 기준 (프로토콜 간 공정). 회복 = 주입 후 currentTime 3초 초과 전진. 미주입=결함이 발동하지 않은 무효 런.

| scenario | stream | player | network | n | 회복 | 트리거실패 | 미주입 | ABR 반응(중앙값) | 오버슈트(중앙값) | rebuffer 수(중앙값) | rebuffer 시간(중앙값) | 에러 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bw_drop | dash_vod | dashjs | unlimited | 5 | 5/5 | 0 | 0 | 28105ms | 0 | 0 | 0ms | 0 |
| bw_drop | dash_vod | shaka | unlimited | 5 | 5/5 | 0 | 0 | 8425ms | 0 | 0 | 0ms | 0 |
| bw_drop | hls_vod | hlsjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| bw_drop | hls_vod | shaka | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 2 | 97ms | 0 |
| bw_recover | dash_vod | dashjs | kbps600 | 5 | 5/5 | 0 | 0 | 219ms | 0 | 0 | 0ms | 0 |
| bw_recover | dash_vod | shaka | kbps600 | 5 | 5/5 | 0 | 0 | 4126ms | 0 | 0 | 0ms | 0 |
| bw_recover | hls_vod | hlsjs | kbps600 | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| bw_recover | hls_vod | shaka | kbps600 | 5 | 5/5 | 0 | 0 | 9823ms | 0 | 2 | 80ms | 0 |
| manifest_fail | dash_live | dashjs | unlimited | 5 | 0/0 | 0 | 5 | — | — | — | — | 0 |
| manifest_fail | dash_live | shaka | unlimited | 5 | 0/5 | 0 | 0 | — | 0 | 0 | 0ms | 5 |
| manifest_fail | hls_live | hlsjs | unlimited | 5 | 5/5 | 0 | 0 | 4234ms | 1 | 1 | 59ms | 0 |
| manifest_fail | hls_live | shaka | unlimited | 5 | 2/5 | 0 | 0 | 47033ms | 0 | 0 | 0ms | 3 |
| offline_3s | dash_vod | dashjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| offline_3s | dash_vod | shaka | unlimited | 5 | 0/5 | 0 | 0 | — | 0 | 0 | 0ms | 5 |
| offline_3s | hls_vod | hlsjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| offline_3s | hls_vod | shaka | unlimited | 5 | 0/5 | 0 | 0 | — | 0 | 2 | 92ms | 5 |
| seg_404 | dash_vod | dashjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| seg_404 | dash_vod | shaka | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| seg_404 | hls_vod | hlsjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| seg_404 | hls_vod | shaka | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 2 | 87ms | 0 |
| seg_delay | dash_vod | dashjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| seg_delay | dash_vod | shaka | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| seg_delay | hls_vod | hlsjs | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 0 | 0ms | 0 |
| seg_delay | hls_vod | shaka | unlimited | 5 | 5/5 | 0 | 0 | — | 0 | 2 | 88ms | 0 |

## 관찰 노트

**라이브 스트림 화질 적응 — 1단계 발견의 해소:** 1단계에서는 라이브 스트림(HLS는 Unified
Streaming, DASH는 DASH-IF livesim2)이 각각 단일 렌디션이라 라이브 조건에서 ABR 화질
적응 비교가 불가능했다. 2단계에서 두 라이브 소스를 BBC R&D 테스트카드(HLS·DASH 동일
소스, 9단계 래더 108p~1080p)로 교체하면서 이 제약이 해소됐다. 실측 결과, 시간가중
해상도가 hls_live hlsjs에서 kbps600 143p → mbps1_5 270p → unlimited 402p로, shaka에서
108p → 167p → 456p로, dash_live dashjs에서 126p → 221p → 274p로 네트워크가 좋아질수록
단조 증가한다 — 라이브 조건에서도 대역폭에 따른 화질 하향/상향 적응이 실측으로
확인됐다. **예외:** dash_live shaka는 unlimited(161p)가 mbps1_5(203p)보다 오히려
낮다 — 1회 관찰로 원인은 미확인이며, 재현되는지는 추가 확인이 필요하다.

**결함 주입 트리거 재설계 — VOD는 검증됨, 라이브는 미해소:** 세그먼트·매니페스트 결함의
발동 기준을 요청 횟수에서 재생 위치(`video.currentTime`)로 바꿨다(2단계). VOD
스트림에서는 의도대로 동작함을 검증했다 — 구현 단계 rep 0 검증에서 HLS·DASH 두
프로토콜의 트리거 시각 차이가 Δ475ms로 좁혀졌다(재설계 전 요청 횟수 기준으로는 같은
시나리오가 DASH에서 t≈167ms(재생 직후), HLS에서 t≈50s에 발동해 약 50초 어긋났다).
이번 배치의 seg_404/seg_delay 결과도
이를 뒷받침한다 — 모든 조합(hls_vod/dash_vod × hlsjs/shaka/dashjs)에서 마크가 15.2~
22.2초(벽시계) 구간에 안정적으로 찍혀, 1단계에서 지적했던 "DASH 세그먼트가 짧아
결함이 t<1000ms에 발동하고 recovered() 판정이 null을 반환하는" 측정 사각지대는 VOD
기준으로는 해소됐다. 표에서 seg_404/seg_delay의 ABR 반응(중앙값)이 여전히 "—"인 것은
측정 결손이 아니라, 세그먼트 1개의 404/지연이 재시도로 해결되는 수준이라 애초에 화질
전환(quality_switch)을 유발하지 않기 때문으로 해석한다.
다만 **라이브 스트림에서는 이 앵커가 의도대로 작동하지 않는다.** 라이브 매니페스트의
`video.currentTime`은 재생 시작부터 세는 상대값이 아니라 스트림 타임라인상의 절대
위치이므로, 메타데이터 로드 직후 이미 앵커 임계값(예: 10초)을 넘는 경우가 흔하다.
실측 근거: `hls_live×hlsjs` 1회차에서 `manifest_abort_1` 마크(t=17639ms)가
`first_frame`(t=18874ms)보다 먼저 찍혔고, `hls_live×shaka` 여러 회차에서도 마크가
`metadata_ms` 직후(14ms~1.2초 내, 5회차 전부)에 발생했다 — 결함이 "재생 10초 후 안정 구간"이
아니라 사실상 재생 시작 전후에 주입된 것이다. 따라서 `manifest_fail`(라이브) 결과는
여전히 "라이브 갱신 실패 내성"이 아니라 "시작 매니페스트 견고성"으로 읽어야 한다 —
원인만 요청 횟수 기준에서 currentTime 절대값 기준으로 바뀌었을 뿐이다. (개선안으로는
라이브에 한해 델타 앵커 — `currentTime - 시작 시점 currentTime` — 을 쓰는 방법이
있으나 이번 태스크 범위 밖이라 제안으로만 남긴다.)

**시나리오 반복 집계에서 드러난 shaka의 결함 내성 차이:** `offline_3s`(재생 30초 지점
3초 완전 차단) VOD 조건에서 shaka는 dash_vod 5/5, hls_vod 5/5 — 합계 10/10 회차 모두
`code=1002` 치명 에러로 재생이 중단됐고, hlsjs·dashjs는 동일 조건 10/10 모두 정상
회복(에러 0)했다. 이 조건은 트리거가 재생 안정 구간(30초 이후, currentTime이 0부터
시작하는 VOD라 앵커가 정확히 작동)에서 발동했음이 확인되므로, 트리거 시점 자체가
왜곡 요인이 아니다 — "이 조건에서 재생 중단으로 이어짐(설정으로 완화 가능성 있음 —
기본 설정 기준 측정)"으로 읽는다. `manifest_fail`(라이브)에서도 shaka는 hls_live
3/5, dash_live 5/5 치명 에러를 냈으나, 위에서 서술했듯 이 조건은 트리거가 재생
시작 전후에 발동한다는 캐비앗이 있어 "라이브 갱신 실패에 취약하다"로 그대로
일반화하지 않는다 — "시작 구간 매니페스트 유실에 취약하다"로 좁혀 읽는다.

**manifest_fail(dashjs × dash_live) 재확인 — 이번에도 무주입:** 5회차 전부
`manifest_abort` 마크가 하나도 찍히지 않았다(집계표의 미주입 5). 60초 관찰 창 안에서
dash.js가 MPD 갱신 요청을 아예 보내지 않았거나 라우트에 잡히지 않는 것으로 보이며,
원인은 이번에도 미확인이다. 이 조합의 `manifest_fail` 결과는 무효 데이터로 유지한다.

**HLS vs DASH 라이브 join 차이 (가설):** shaka가 hls_live·dash_live 양쪽에 모두
있어 라이브러리를 통제한 비교가 가능하다 — startup 중앙값이 hls_live에서 kbps600
14572ms, mbps1_5 10223ms, unlimited 12029ms인 반면, dash_live에서는 각각 7117ms,
4356ms, 4600ms로 세 네트워크 조건 모두에서 HLS가 DASH보다 약 2~2.6배 느리다.
hlsjs/dashjs 조합(unlimited, 3476ms vs 1800ms)에서도 같은 방향이 보조적으로
관찰된다. 원인은 검증하지 않았다 — 라이브 엣지까지의 거리를 계산하는 휴리스틱(목표
지연, 세그먼트 길이, 플레이리스트 갱신 주기 등)이 프로토콜·라이브러리마다 달라 초기
버퍼 확보 시간에 영향을 줄 수 있다는 가설로만 남긴다.
