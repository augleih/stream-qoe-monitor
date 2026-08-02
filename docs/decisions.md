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
- **dash.js QUALITY_CHANGE_RENDERED 이벤트 필드 v4/v5 양쪽 대응**: dash.js v5는 전환 이벤트에
  `e.newRepresentation`(객체: height/bandwidth 포함)을, v4는 `e.newQuality`(레벨 인덱스만)를 넘겨
  필드 구조가 다르다. 설치된 버전(v5.2.0)은 `newRepresentation` 경로를 타지만, 어댑터
  (`player/adapters.js`)는 두 필드 모두 방어적으로 처리하도록 작성 — 버전 문서·예제 코드가
  v4 기준으로 섞여 있어 실제 실행 결과로 필드명을 확인한 뒤 반영.

## 2026-08-01 (Task 8: 3일차 본실행 — 120회 매트릭스)
- **라이브 스트림 단일 렌디션 발견 및 관찰 노트 정정**: 120회 매트릭스 완주 후 quality_switch/샘플
  타임라인을 확인한 결과, hls_live(Unified Streaming)는 전 네트워크 조건에서 720p 하나만,
  dash_live(DASH-IF livesim2)는 360p 하나만 재생됨을 발견 — 두 라이브 스트림 모두 화질
  래더가 없는 단일 렌디션이었다. 초안 관찰 노트는 저대역폭 rebuffer 증가를 "버퍼 확보 전략"으로
  오독했으나, height 샘플 재검토로 "유일 렌디션 제약(대역폭이 그 렌디션 비트레이트에 미달)"이
  원인임을 정정했다(커밋 `f64c9d8`). **영향**: 라이브 조건에서는 ABR 화질 적응 비교가 성립하지
  않는다 — README/한계 섹션과 docs/verification-plan.md에 명시.
- **관찰 노트 보존 구조 분리**: `npm run report`가 `report/summary.md`를 매 실행마다 전체
  재생성하면서, 손으로 쓴 해석 노트("관찰 노트")가 자동 집계에 덮어써지는 문제를 발견.
  `report/observations.md`를 별도 파일로 두고 `src/cli/report.ts`가 리포트 생성 후 그 내용을
  `summary.md` 끝에 append하도록 수정 — "집계는 자동, 해석은 수동 유지"라는 scratch.md 6장
  원칙을 파이프라인에 반영한 것.

## 2026-08-02 (Task 9: 결함·조건 변화 시나리오 6종)
- **DASH 결함 주입 측정 사각지대**: 세그먼트 요청 횟수 기준 결함(`seg_404`, `seg_delay`, 8번째
  요청에 주입)이 DASH에서는 세그먼트 길이가 짧아(~2초, HLS는 ~6-10초) 재생 시작 직후
  (t<1000ms)에 발동한다. `recovered()` 판정은 "결함 시점 이전의 마지막 1초 샘플"을 참조하는데
  이 시점엔 샘플이 아직 없어 `null`을 반환 — 실제로는 ABR 반응이 있었음에도(예:
  `seg_404|dash_vod|dashjs` 112ms) 결과가 null로 보이는 현상. 플레이어 결함이 아니라 측정
  설계의 사각지대임을 report/observations.md와 docs/metrics.md 알려진 한계에 기록.
- **manifest_fail(dashjs × dash_live) 무효 데이터 판정**: 60초·120초 관찰 창 모두에서
  manifest_abort 표지가 0개로, 결함이 실제로 주입되지 않았다. dash.js MPD 갱신 주기가 관찰
  창보다 길어 트리거 자체가 발동하지 않은 것으로 추정(원인 미확인). 결과 파일은 보존하되
  해당 조합의 시나리오 결과는 무효로 명시(커밋 `692a94f`) — 리포트 표에서 이 행만 보고
  "dash.js가 결함을 완벽히 방어했다"로 오독하지 않도록 README/한계 섹션에도 반영.

## 2026-08-02 (Task 11: GitHub Actions 스모크 CI)
- **rep 0 = ad-hoc 측정 관례**: 매트릭스 반복 실행(rep 1~5, 통계 집계 대상)과 구분되는 1회성
  측정(CI 스모크, 수동 점검)은 `rep 0`으로 표기하는 관례를 도입. `src/aggregate.ts`의
  `aggregate()`가 `rep < 1`인 결과를 통계 집계에서 자동 제외하므로, CI가 매일/매 push마다
  남기는 스모크 측정이 벤치마크 표의 중앙값·P95를 오염시키지 않는다. `smoke.yml`의 measure
  스텝에 `--rep 0`을 명시해 이 관례를 강제.

## 2026-08-02 (Task 12: 문서화 — 리뷰 반영)
- **smoke.yml 아티팩트 업로드에 `if: always()` 추가**: 원래는 measure 스텝이 성공해야만
  결과 JSON을 업로드했다. 실패 시 진단할 자료가 남지 않는다는 리뷰 지적을 반영해
  `actions/upload-artifact` 스텝에 `if: always()`를 추가 — measure가 실패해도 그때까지
  생성된 결과/에러 JSON이 아티팩트로 남아 원격 실패를 로컬 재현 없이 진단할 수 있다.
