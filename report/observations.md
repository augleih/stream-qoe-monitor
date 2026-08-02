## 관찰 노트

**저대역폭 환경에서의 프로토콜별 적응 패턴:** Live 스트림(hls_live 720p만, dash_live 360p만 제공)은 단일 렌디션 제약으로 인해 kbps600에서 rebuffer ratio 급증(hls_live hlsjs: 0.0045→0.0371, shaka: 0→0.0805). 이는 **대역폭이 유일한 렌디션의 비트레이트에 미달하는 상황**으로, 선택지가 없어 rebuffer로 나타난 것이 **의도된 행동**. 반면 VOD 스트림은 해상도 적응(hls_vod hlsjs: 1037p→234p)으로 rebuffer 최소화. **예외:** hls_vod hlsjs에서 mbps1_5 rebuffer(0.0133)가 kbps600(0)보다 높음 — 대역폭 절벽 부근에서 ABR 진동의 전형적 현상. **결함 없음:** 모든 관찰이 프로토콜 및 네트워크 제약 하의 예상된 행동.

**세그먼트 단위 결함 주입의 측정 한계:** DASH 세그먼트는 HLS보다 짧아(≈2s vs ≈6-10s), 8번째 세그먼트 요청 기준 결함(seg_404, seg_delay)이 재생 시작 직후 t<1000ms에 발동된다. 이로 인해 recovered() 판정 기준인 "마지막 mark 이전의 샘플"이 존재하지 않아 null이 반환된다. 실제로는 ABR 반응이 발생했으나(예: seg_404|dash_vod|dashjs ABR 반응 112ms) recovered 값이 null인 것은 **측정 맹점**이지 플레이어 실패가 아님. HLS와 DASH의 세그먼트 타이밍 차이를 결과 해석 시 고려할 것.

**manifest 갱신 주기와 시나리오 창:** manifest_fail|dash_live|dashjs는 60초 관찰 창에서 manifest_abort 표지가 0개였고, 120초 창에서도 동일. 결함이 주입되지 않은 원인은 미확인(추정: 관찰 창 내 MPD 재요청이 라우트에 잡히지 않음 — 갱신 주기 또는 캐시 동작으로 추정). 따라서 이 조합의 시나리오 결과는 실제 manifest 처리 동작을 반영하지 않는 무효 데이터임을 명시한다.
