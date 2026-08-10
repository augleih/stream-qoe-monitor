# stream-qoe-monitor

웹 스트리밍 재생 품질(QoE)을 지속적으로 자동 측정·감시하는 도구.
CI에서 매일 측정이 돌고([.github/workflows/smoke.yml](.github/workflows/smoke.yml)),
같은 장치로 hls.js / dash.js / Shaka Player 비교 벤치마크를 산출했다.
전체 결과는 [대시보드](https://augleih.github.io/stream-qoe-monitor/)에서 한눈에 볼 수 있다
(매일 CI가 추이를 갱신·재배포).

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

- 스트림 4종(HLS/DASH × VOD/라이브)에 걸친 유효 조합 8개 × 네트워크 3단계 × 5회 = **120회** 자동 측정
- 결정적 결함·조건 변화 시나리오 6종 (404 / 지연 / 차단 / 매니페스트 갱신 실패 / 대역폭 하강 / 대역폭 회복) —
  조합 24개 × 5회 반복 = **120회**. 발동 기준은 벽시계·요청 횟수가 아니라 **재생 위치**(`video.currentTime`, [docs/metrics.md](docs/metrics.md#시나리오-트리거-기준-재생-위치-앵커)) —
  프로토콜마다 요청 타이밍이 달라 생기는 편차를 없앤다. 집계도 "결함이 실제로 주입됐는가"를
  먼저 나누는 **주입 인지 집계**(injected / trigger_timeout / 미주입)를 거쳐, 결함이 발동조차
  안 한 런이 "정상 회복"으로 잘못 세지 않도록 한다
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
npm run scenario-batch -- --reps 5   # 결함 시나리오 6종 배치 (재생 위치 트리거)
npm run report                       # report/summary.md 재생성
npm run trend                        # 일일 스모크 추이 재생성 (report/trend.md)
npm run dashboard                    # dashboard/index.html 재생성 (Pages 배포물)
```

CMCD([CTA-5004](https://cta.tech/), opt-in) 데모: `npm run serve` 후
`player/index.html?player=hlsjs&src=<스트림 URL>&cmcd=1`로 열면 미디어 요청 쿼리에
CMCD 파라미터가 실린다(기본값 off — 자세한 내용: [docs/metrics.md](docs/metrics.md#cmcd-common-media-client-data-cta-5004)).

## 결과 요약

**hls_vod (kbps600)** — 같은 저대역폭 조건에서 hlsjs는 4906ms(P95 6370ms)만에
234p로 재생을 시작해 5회 모두 rebuffer가 없었고, shaka는 16671ms(P95
17486ms, 약 3.4배 느림)로 더 오래 걸리는 대신 347p로 더 높은 화질에
자리잡고 그 대가로 매 회차 소폭의 rebuffer를 남긴다(ratio 0.0012, 5회
전부 발생) — startup과 화질을 맞바꾼 전형적인 트레이드오프다. 같은 표의
unlimited 행에서 hlsjs는 중앙값 255ms인데 P95는 2253ms로 9배 뛴다 —
평균이 아니라 중앙값+P95를 같이 봐야 하는 이유가 이 한 줄에 있다.
(예외: mbps1_5 행은 hlsjs의 rebuffer ratio(0.0133)가 kbps600(0)보다 오히려
높다 — 대역폭 절벽 부근에서 화질을 올렸다 내렸다 하는 ABR 진동으로 해석한다.
자세한 내용: [report/observations.md](report/observations.md).)

| network | player | n(실패) | startup 중앙값 | startup P95 | rebuffer ratio | rebuffer 세션% | 드롭률 | 시간가중 해상도 |
|---|---|---|---|---|---|---|---|---|
| kbps600 | hlsjs | 5(0) | 4906ms | 6370ms | 0 | 0% | 0 | 234p |
| kbps600 | shaka | 5(0) | 16671ms | 17486ms | 0.0012 | 100% | 0.0021 | 347p |
| mbps1_5 | hlsjs | 5(0) | 2122ms | 3618ms | 0.0133 | 100% | 0.0093 | 327p |
| mbps1_5 | shaka | 5(0) | 6867ms | 8295ms | 0.0009 | 100% | 0.0006 | 720p |
| unlimited | hlsjs | 5(0) | 255ms | 2253ms | 0 | 0% | 0 | 1037p |
| unlimited | shaka | 5(0) | 288ms | 1834ms | 0.0011 | 100% | 0 | 1019p |

![startup hls_vod kbps600](report/charts/startup_hls_vod_kbps600.svg)

**라이브 스트림(BBC R&D 테스트카드, HLS·DASH 동일 소스 9단계 래더 108p~1080p)도
이제 ABR 비교가 가능하다.** 1단계에서는 라이브 소스(Unified Streaming HLS /
DASH-IF livesim2 DASH)가 각각 렌디션 1개뿐이라 라이브 조건에서 화질 적응
비교 자체가 성립하지 않았다. 2단계에서 BBC로 교체한 뒤 실측한 시간가중
해상도는 hls_live hlsjs에서 kbps600 143p → mbps1_5 270p → unlimited 402p로,
dash_live dashjs에서 126p → 221p → 274p로 네트워크가 좋아질수록 단조
증가한다 — 라이브 조건에서도 대역폭에 따른 화질 적응이 실측으로 확인됐다.
(예외: dash_live shaka는 unlimited 161p가 mbps1_5 203p보다 낮다 — 이번
측정 캠페인에서 관찰됐고 원인은 미확인이다.) 같은 라이브러리(shaka)가 두 프로토콜 모두에 있어
직접 비교하면, startup 중앙값이 hls_live에서 kbps600 14572ms/mbps1_5
10223ms/unlimited 12029ms인 반면 dash_live에서는 7117ms/4356ms/4600ms로
세 조건 모두 HLS가 DASH보다 약 2~2.6배 느리다 — 원인은 검증하지 않은
가설(라이브 엣지 거리 휴리스틱 차이)로만 남긴다.

**결함 시나리오 반복(5회)에서 shaka의 결함 내성 취약점이 통계로 드러났다.**
`offline_3s`(재생 30초 지점 3초 완전 차단) VOD 조건에서 shaka는 dash_vod
5/5·hls_vod 5/5 — 합계 **10/10 회차 모두 치명 에러로 재생이 중단**됐고,
hlsjs·dashjs는 동일 조건 10/10 모두 정상 회복했다. "이 조건에서 재생
중단으로 이어짐(설정으로 완화 가능성 있음 — 기본 설정 기준 측정)"으로
읽는다. 자세한 내용과 라이브 매니페스트 결함(`manifest_fail`)의 해석
주의사항: [report/observations.md](report/observations.md).

전체 24행 표·12개 차트·시나리오 반복 집계: [report/summary.md](report/summary.md).
일일 CI 스모크 추이: [report/trend.md](report/trend.md).

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
- **결함 주입 트리거는 라이브 스트림에서 미해소**: 결함 발동 기준을 재생
  위치(`video.currentTime`)로 바꾸며 VOD에서는 프로토콜 간 편차를
  Δ475ms까지 좁혔지만(과거 요청 횟수 기준으로는 최대 ~50초 편차), 라이브
  스트림은 `currentTime`이 재생 시작부터 세는 상대값이 아니라 스트림
  타임라인상의 절대 위치라 이 앵커가 의도대로 작동하지 않는다 — 결함이
  "재생 안정 구간 이후"가 아니라 사실상 재생 시작 전후에 발동한다.
  `manifest_fail`(라이브) 결과는 그래서 "라이브 갱신 실패 내성"이 아니라
  "시작 매니페스트 견고성"으로 읽어야 한다. `manifest_fail`(dashjs ×
  dash_live) 조합은 이번 재측정에서도 60초 관찰 창 안에 결함이 한 번도
  주입되지 않아(5/5 미주입) 무효 데이터로 유지한다 — 자세한 내용:
  [report/observations.md](report/observations.md).
- **추이 데이터는 축적 초기 단계**: 일일 CI 스모크가 쌓는 [report/trend.md](report/trend.md)는
  아직 데이터 포인트가 적고, CI 러너의 성능 편차(공유 클라우드 VM)가
  섞여 있어 로컬 측정과 직접 비교할 수 없다 — 같은 CI 환경 안에서의
  날짜 간 추이 비교로만 유효하다. CI는 아티팩트만 축적하고, 리포트 갱신은
  로컬에서 `npm run trend` 수동 실행(gh CLI 필요)으로 이뤄진다.
- **공개 테스트 스트림 의존**: 자체 CDN·인코딩 파이프라인이 아니라
  Apple / DASH-IF / BBC R&D의 공개 데모 스트림을 쓴다. 스트림이
  죽으면 URL을 교체해야 하고(교체 이력: [docs/decisions.md](docs/decisions.md)),
  실제 서비스 CDN·인코딩 특성은 반영하지 않는다.
- **DRM 미측정**: 라이선스 요청·복호화는 검증 범위에서 제외했다(공개
  테스트 스트림에 DRM이 없다).
- **모바일·TV 미포함**: 앱 빌드나 실기기가 필요해 이번 범위에서는 뺐다.
  다만 지표 정의(CTA-2066 매핑)는 플랫폼 중립적으로 설계해서, 동일 지표를
  Android는 ExoPlayer `AnalyticsListener`, iOS는 AVPlayer
  `AVPlayerItemAccessLog`로 확장해 같은 리포트 포맷에 편입할 수 있다.
