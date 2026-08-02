# stream-qoe-monitor

웹 스트리밍 재생 품질(QoE)을 지속적으로 자동 측정·감시하는 도구.
CI에서 매일 측정이 돌고([.github/workflows/smoke.yml](.github/workflows/smoke.yml)),
같은 장치로 hls.js / dash.js / Shaka Player 비교 벤치마크를 산출했다.

## 왜

재생 시작이 2초를 넘으면 이탈이 시작되고, 이후 1초마다 이탈률이 5.8%씩
늘어난다. 영상 길이의 1%에 해당하는 rebuffer만 있어도 시청 시간이 5%
줄어든다(Krishnan & Sitaraman, "Video Stream Quality Impacts Viewer
Behavior", ACM IMC 2012). 재생 품질은 감으로 판단할 값이 아니라 숫자로
추적해야 하는 지표이고, 배포마다 달라질 수 있으므로 한 번 재고 끝나는
게 아니라 **지속적으로 감시해야 하는 대상**이다. 이 프로젝트는 그 감시
도구를 만들고, 그 도구로 세 플레이어 라이브러리(hls.js / dash.js / Shaka
Player)를 비교해 "플레이어 선택은 트레이드오프 선택"이라는 걸 데이터로
보였다.

## 무엇을

- 스트림 4종(HLS/DASH × VOD/라이브) × 유효 조합 8개 × 네트워크 3단계 × 5회 = **120회** 자동 측정
- 결정적 결함 주입 5종 (404 / 지연 / 차단 / 매니페스트 갱신 실패 / 대역폭 하강)
- 지표는 CTA-2066 준거([docs/metrics.md](docs/metrics.md)), 통계는 중앙값+P95([docs/verification-plan.md](docs/verification-plan.md))

## 어떻게

```
[플레이어 페이지] ← [Playwright 러너] → [결과 JSON] → [집계] → [리포트]
```

세 라이브러리를 각자의 데모 페이지가 아니라 **같은 플레이어 페이지**
(`player/`)에서 `?player=&src=` 쿼리로 전환하며 실행한다 — 페이지 무게가
다르면 그 자체가 측정 오염 요인이 된다. Playwright 러너(`src/`)가 회차마다
새 브라우저 컨텍스트를 만들고(캐시 이월 방지), 페이지 진입 **전에** CDP로
네트워크 조건을 걸고, 60초 동안 media element 이벤트를 관찰해 JSON으로
회수한다. 브라우저는 **Chromium 계열(`channel: 'chrome'`) 한정**이다 —
네트워크 제어·결함 주입이 CDP 기능이고, Playwright 기본 Chromium 빌드는
H.264/AAC 코덱이 없어 테스트 스트림 자체가 재생되지 않는다.

## 실행

```bash
npm i && npx playwright install chrome
npm run validate-streams   # 8조합 재생 확인
npm run measure -- --player hlsjs --stream hls_vod
npm run matrix -- --networks unlimited,mbps1_5,kbps600 --reps 5
npm run report
```

## 결과 요약

**hls_vod (kbps600)** — 같은 저대역폭 조건에서 hlsjs는 4906ms(P95 6370ms)만에
234p로 재생을 시작해 5회 모두 rebuffer가 없었고, shaka는 16671ms(P95
17486ms, 약 3.4배 느림)로 더 오래 걸리는 대신 347p로 더 높은 화질에
자리잡고 그 대가로 매 회차 소폭의 rebuffer를 남긴다(ratio 0.0012, 5회
전부 발생) — startup과 화질을 맞바꾼 전형적인 트레이드오프다. 같은 표의
unlimited 행에서 hlsjs는 중앙값 255ms인데 P95는 2253ms로 9배 뛴다 —
평균이 아니라 중앙값+P95를 같이 봐야 하는 이유가 이 한 줄에 있다.

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | hlsjs | 5(0) | 4906ms | 6370ms | 0 | 0% | 0 | 234p |
| kbps600 | shaka | 5(0) | 16671ms | 17486ms | 0.0012 | 100% | 0.0021 | 347p |
| mbps1_5 | hlsjs | 5(0) | 2122ms | 3618ms | 0.0133 | 100% | 0.0093 | 327p |
| mbps1_5 | shaka | 5(0) | 6867ms | 8295ms | 0.0009 | 100% | 0.0006 | 720p |
| unlimited | hlsjs | 5(0) | 255ms | 2253ms | 0 | 0% | 0 | 1037p |
| unlimited | shaka | 5(0) | 288ms | 1834ms | 0.0011 | 100% | 0 | 1019p |

![startup hls_vod kbps600](report/charts/startup_hls_vod_kbps600.svg)

**hls_live (kbps600)는 위와 다르게 읽어야 한다.** 이 스트림은 720p
단일 렌디션이라 화질을 낮출 옵션이 없다 — hlsjs 4656ms/rebuffer ratio
0.0371, shaka 12608ms/0.0805로, 화질은 둘 다 그대로인 채 startup과
rebuffer가 **둘 다** shaka 쪽이 나쁘다. 맞바꿀 화질 레버가 없으므로
이건 트레이드오프가 아니라 두 라이브러리의 초기 버퍼링·재생 정책 차이로
읽는다([검증 계획 §6](docs/verification-plan.md#6-결과-해석-원칙)의
"startup 느림 + rebuffering 많음 → 둘 다 나쁨" 케이스).

전체 24행 표·12개 차트·시나리오 결과: [report/summary.md](report/summary.md)

## AI 협업 방식

이 프로젝트는 Claude와 협업해 5일간 구축했다.

- 검증 설계(무엇을 왜 재는가)와 모든 의사결정은 사람이 소유 — 근거: [docs/decisions.md](docs/decisions.md)
- AI는 구현·계획 검토·타이핑을 보조. 계획 검토 중 AI가 측정 매트릭스의 결함
  (hls.js=HLS 전용·dash.js=DASH 전용이라 교차 불가한 조합)을 지적했고,
  사람이 135회 → 120회 재설계를 승인했다
- 이 구도 자체가 "AI를 활용한 QA 프로세스"의 실증이다

## 한계

- **Chromium 계열 한정, Safari 제외**: 네트워크 제어·결함 주입이 CDP(Chrome
  DevTools Protocol) 기능이라 다른 브라우저 엔진에서는 동일하게 구현할 수
  없다. Safari는 HLS를 OS 네이티브(AVFoundation)로 재생해 애초에 측정
  대상인 라이브러리 계층을 거치지 않는다.
- **라이브 스트림은 단일 렌디션**: hls_live(720p)와 dash_live(360p) 모두
  테스트 가능한 공개 라이브 스트림이 렌디션 1개뿐이라, 라이브 조건에서는
  ABR 화질 적응 비교가 불가능하다 — 위 결과 요약에서 다룬 이유다. ABR
  비교는 VOD 조합에서만 유효하다.
- **결함 주입 측정 사각지대**: DASH 세그먼트(~2초)가 HLS(~6~10초)보다
  짧아, 세그먼트 요청 횟수 기준 결함이 재생 시작 직후(t<1000ms)에 발동돼
  회복 판정이 비교할 이전 샘플을 찾지 못하고 `null`을 반환하는 경우가
  있다. `manifest_fail`(dashjs × dash_live) 조합은 60초·120초 관찰 창
  모두에서 결함이 실제로 주입되지 않아 이 조합의 시나리오 결과는 무효
  데이터다 — 자세한 내용: [report/observations.md](report/observations.md).
- **공개 테스트 스트림 의존**: 자체 CDN·인코딩 파이프라인이 아니라
  Apple / DASH-IF / Unified Streaming의 공개 데모 스트림을 쓴다. 스트림이
  죽으면 URL을 교체해야 하고(교체 이력: [docs/decisions.md](docs/decisions.md)),
  실제 서비스 CDN·인코딩 특성은 반영하지 않는다.
- **DRM 미측정**: 라이선스 요청·복호화는 검증 범위에서 제외했다(공개
  테스트 스트림에 DRM이 없다).
- **모바일·TV 미포함**: 앱 빌드나 실기기가 필요해 이번 범위에서는 뺐다.
  다만 지표 정의(CTA-2066 매핑)는 플랫폼 중립적으로 설계해서, 동일 지표를
  Android는 ExoPlayer `AnalyticsListener`, iOS는 AVPlayer
  `AVPlayerItemAccessLog`로 확장해 같은 리포트 포맷에 편입할 수 있다.
