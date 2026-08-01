# 설계·구현 의사결정 기록

각 항목: 무엇을 / 왜 / 대안은 무엇이었나. AI(Claude)와의 협업 과정에서
내린 결정을 축적한다. 결정의 소유자는 사람이고, AI는 구현과 검토를 보조했다.

## 2026-07-31 (설계 세션)
- **측정 매트릭스 재편성 (135→120회)**: 계획 검토 중 hls.js(HLS 전용)·dash.js(DASH 전용)
  교차 불가 조합을 발견. 스트림 4종(HLS/DASH × VOD/라이브) × 유효 조합 8개로 재설계.
- **세 플레이어를 같은 페이지에서 실행**: 각자 데모 페이지는 무게가 달라 측정이 오염됨.
- **평균 금지, 중앙값+P95**: 평균은 나쁜 소수를 숨기고, 그 소수가 이탈하는 사용자다.

## 2026-08-01 (구현 계획)
- **`channel: 'chrome'` 강제**: Playwright 기본 Chromium은 H.264/AAC 미포함으로
  테스트 스트림 재생 불가. 계획 검토 단계에서 식별.
- **DASH 라이브는 DASH-IF livesim2**: 설계서는 Akamai였으나 livesim2가 상시 가동
  시뮬레이터라 더 안정적. Akamai HLS 라이브는 유지.
- **차트는 자체 SVG 생성**: 외부 차트 라이브러리 없이 ~60줄. GitHub에서 바로 렌더링.
- **세그먼트 결함 주입은 요청 횟수 기준**: 시간 기준은 플레이어별 요청 타이밍이 달라
  비결정적이 됨. N번째 세그먼트 요청에 주입하면 재현 가능.
- **포지셔닝은 지속 QoE 모니터링 도구**: 벤치마크는 응용 사례. CI cron으로 매일 측정.
  이름도 stream-qoe-monitor로 확정 (기능 위주, 특정 서비스 키워드 배제).
- **Safari 제외 유지 (재검토 후)**: Safari는 HLS를 네이티브(AVFoundation) 재생해
  측정 대상인 라이브러리 계층을 거치지 않고, CDP가 없어 네트워크 제어·결함 주입 불가.

## 2026-08-01 (Task 4: 스트림 검증 게이트)
- **Akamai HLS 라이브 URL 2종 모두 세그먼트 레벨 404로 사망**: 1일차 검증 실행 시 hls_live (hls.js × Akamai)와 
  hls_live × Shaka 모두 404 실패. 설계서의 대체 URL(moctobpltc-i.akamaihd.net)로 재시도했으나 
  동일한 404 발생. 두 Akamai 엔드포인트 모두 현재 세그먼트 요청 레벨에서 접근 불가 상태.
  **해결책**: Unified Streaming 데모 HLS 라이브로 교체 (주: https://demo.unified-streaming.com/k8s/live/stable/live.isml/.m3u8, 
  대체: https://demo.unified-streaming.com/k8s/live/stable/scte35.isml/.m3u8).
  **최종 검증 결과**: **8/8 combos OK** — VOD 4/4, DASH 라이브 2/2, HLS 라이브 2/2 (Unified Streaming에서 모두 통과).
  일차 리스크 게이트 완료: Shaka HLS 재생 가능 확인, 4종 스트림 모두 playable 확인.

## (이후 결정을 날짜별로 추가)
