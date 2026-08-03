# 스트리밍 QoE 검증 범위 정리

> stream-qoe-monitor 프로젝트 검증 계획
> 최종 갱신: 2026-08-02

이 문서는 구현에 앞서 세운 검증 계획이다. 실행 중 발견한 사실
(라이브 스트림 단일 렌디션, DASH 결함 주입 측정 사각지대 등)과
스트림 URL 교체 이력은 이 문서를 고치는 대신 [decisions.md](decisions.md)와
[observations.md](../report/observations.md)에 기록했다 — 계획은 계획대로,
실행 중 발견은 발견대로 남겨야 무엇을 근거로 무엇을 바꿨는지 추적할 수 있다.

---

## 1. 스트리밍 기능 (검증 대상 기능)

### 재생 시작

- 매니페스트 로드
- 초기 화질 선택
- 첫 세그먼트 수신
- 디코더 초기화
- 첫 프레임 렌더

### 재생 지속

- 세그먼트 연속 수신
- 버퍼 관리
- 디코딩·렌더링

### 화질 적응 (ABR)

- 대역폭 추정
- 화질 하향 전환
- 화질 상향 전환
- 수동 화질 고정

### 오류 대응

- 세그먼트 실패 시 재시도
- 느린 세그먼트 중도 포기(abandon)
- 네트워크 끊김 후 재개

### 라이브 전용

- 매니페스트 주기적 갱신
- 라이브 엣지 추종
- 지연 관리

### VOD 전용

- Seek
- 종료 처리

### DRM

- 라이선스 요청·취득
- 복호화

---

## 2. 구현 라이브러리

### 이번 프로젝트 대상 (웹)

| 라이브러리 | 지원 규격 | 특징 |
|---|---|---|
| **hls.js** | HLS | 가볍고 단순, 가장 널리 사용 |
| **dash.js** | DASH | DASH 진영 레퍼런스 구현 |
| **Shaka Player** | HLS + DASH | 구글 제작, DRM·자막 기능 풍부 |

세 라이브러리 모두 브라우저에서 동작하며, 담당하는 계층이 동일하다.
매니페스트 해석과 ABR 판단까지가 라이브러리 영역이고,
디코딩·렌더링·DRM 처리는 브라우저(MSE/EME)가 담당한다.

### 대상 외 (참고)

| 플랫폼 | 플레이어 | 제외 사유 |
|---|---|---|
| Safari | 브라우저 네이티브 | HLS 네이티브 처리, 라이브러리를 거치지 않음 |
| iOS | AVPlayer | 앱 빌드 필요 |
| Android / Android TV | ExoPlayer (Media3) | 앱 빌드 필요 |
| Tizen (삼성 TV) | AVPlay | 실기기 필요 |
| webOS (LG TV) | 웹 기반 | 실기기 필요 |

동일 지표 정의를 ExoPlayer `AnalyticsListener`,
AVPlayer `AVPlayerItemAccessLog` 로 확장 가능하도록 설계한다.

---

## 3. 검증 항목

### Phase 1 — 정상 경로

| 항목 | 지표 |
|---|---|
| 매니페스트 로드 | `manifest_loaded_ms` |
| 첫 세그먼트 수신 | `first_segment_ms` |
| 디코더 초기화 | `metadata_ms` |
| 첫 프레임 렌더 | `first_frame_ms` |
| 재생 시작 전체 | `startup_ms` |
| 구간별 소요시간 | `breakdown` |
| 끊김 | `rebuffer_count`, `rebuffer_ratio` |
| 프레임 드롭 | `dropped_ratio` |

### Phase 2 — 네트워크 조건 변화

| 항목 | 지표 |
|---|---|
| 대역폭 하강 시 반응 | `abr_reaction_ms` |
| 대역폭 회복 시 반응 | 상향 전환 지연 |
| 불필요한 왕복 전환 | 오버슈트 횟수 |
| 최종 화질 수준 | 시간 가중 평균 해상도 |
| 저대역폭 환경 끊김 | 조건별 `rebuffer_ratio` |
| 버퍼 추이 | 시계열 |

### Phase 3 — 결함 주입 (여유 시)

난수가 아닌 **결정적 시나리오**로 주입한다.
난수를 쓰면 조건이 매번 달라져 플레이어 간 비교가 성립하지 않는다.
**트리거 기준: 재생 위치(video.currentTime)** — 벽시계나 요청 횟수가 아니라 프레임 시간으로 동기화.

| 주입 | 확인 대상 | 방법 |
|---|---|---|
| 세그먼트 404 | 재시도 여부 | 재생 15초 후 첫 요청 404 (`page.route`) |
| 세그먼트 지연 5초 | abandon 동작 | 재생 15초 후 첫 요청 5초 지연 (`page.route`) |
| 네트워크 3초 차단 | 자동 재개 여부 | 재생 30초에 완전 차단 → 3초 경과 후 복구 (CDP `offline`) |
| 매니페스트 갱신 실패 | 재생 유지 여부 | 재생 10초 후 갱신 요청 3회 차단 (`page.route`) |
| 대역폭 하강 | ABR 하향 반응 | 재생 20초에 600kbps로 하강 (CDP `emulateNetworkConditions`) |
| 대역폭 회복 | 상향 전환 지연 | 재생 20초에 무제한 회복 — `--network kbps600` 시작 전제 (CDP `emulateNetworkConditions`) |

예시 시나리오 (`offline_3s`, 재생 위치 앵커 — 벽시계 아님):

```
video.currentTime=0    재생 시작
video.currentTime=30   네트워크 완전 차단 (CDP offline)
                        3초 경과
                        네트워크 복구
observeMs 경과          관찰 종료
```

트리거 기준의 상세 정의와 알려진 한계: [metrics.md](metrics.md#시나리오-트리거-기준-재생-위치-앵커).

### 제외 항목

| 항목 | 제외 사유 |
|---|---|
| 인코딩 품질 (VMAF) | 원본 자산 없음 |
| 영상 결함 (블랙 프레임, 프리즈, 밴딩) | 원본 없이는 정상/결함 판정 불가 |
| CDN 성능 | 접근 불가 |
| 라이선스 서버 성능 | 접근 불가 |
| 라이브 송출 장애 | 외부에서 유발 불가 |
| 동시 접속 부하 | 유발 불가 |
| Smart TV / 모바일 플레이어 | 실기기·앱 빌드 필요 |
| Seek, DVR | 우선순위 낮음 |

---

## 4. 실행 조건

### 전체 매트릭스 (최종 목표)

hls.js는 HLS 전용, dash.js는 DASH 전용이라 스트림 3종 × 라이브러리 3종을
전부 교차할 수 없다. 스트림 4종(HLS/DASH × VOD/라이브) 기준 **유효 조합 8개**로
매트릭스를 구성한다.

| 스트림 | hls.js | dash.js | Shaka |
|---|---|---|---|
| HLS VOD (Apple bipbop) | ✅ | ❌ | ✅ |
| DASH VOD (DASH-IF Envivio 벡터) | ❌ | ✅ | ✅ |
| HLS 라이브 (Unified Streaming) | ✅ | ❌ | ✅ |
| DASH 라이브 (DASH-IF livesim2) | ❌ | ✅ | ✅ |

> 참고: 라이브 스트림 2종은 2026-08-02 BBC 테스트카드(9단계 래더)로 교체됨 — 근거와 경위는 [decisions.md](decisions.md) 참조.

```
유효 조합 8개 × 네트워크 3단계 × 5회 반복 = 120회
```

| 구분 | 값 |
|---|---|
| 스트림 | Apple bipbop HLS VOD / DASH-IF Envivio DASH VOD / Unified Streaming HLS 라이브 / DASH-IF livesim2 DASH 라이브 |
| 네트워크 | 무제한 / 1.5Mbps / 600kbps |
| 관찰 시간 | 세션당 60초 |
| 계측 방식 | media element 이벤트 + Resource Timing |

라이브 스트림 URL은 원 설계(Akamai)에서 세 차례 교체됐다(DASH→livesim2,
HLS→Unified Streaming, 이후 두 라이브 모두 BBC 테스트카드로) — 경위는
[decisions.md](decisions.md) 참고.

네트워크 단계는 Apple bipbop 스트림의 화질 래더
(232k / 650k / 1M / 2M)에 맞춰 설정했다.
1.5Mbps는 1M 단계까지, 600kbps는 232k만 소화 가능하므로
"어느 단계로 내려갔어야 하는데 실제로 어디로 갔나"를 판정할 수 있다.

### Phase 1 범위

```
HLS VOD × hls.js × 무제한 × 1회
```

---

## 5. 계측 원칙

- 계측 지점은 UI 상태(DOM, 클래스명)가 아니라 media element 이벤트에 둔다
- 첫 프레임 판정은 `requestVideoFrameCallback` 을 사용한다.
  `playing` 이벤트는 재생 상태 진입일 뿐 화면 렌더를 보장하지 않는다
- 첫 프레임 이전의 `waiting` 은 초기 버퍼링이므로 rebuffering 집계에서 제외한다
- 회차마다 브라우저 컨텍스트를 새로 만들고 폐기한다 (캐시 이월 방지)
- 네트워크 조건은 페이지 진입 **전에** 설정한다
- 측정과 집계를 분리한다. 회차별 원본 JSON(요약 + 이벤트 타임라인)을 그대로 남긴다
- 지표 정의는 CTA-2066 을 따른다

---

## 6. 결과 해석 원칙

측정된 차이는 대부분 결함이 아니라 **설계 선택**이다.

| 관찰 | 가능한 해석 |
|---|---|
| startup 느림 | 버퍼를 넉넉히 잡음(의도) / 초기 화질 높게 잡음(의도) / 실제 병목 |
| 화질 안 올라감 | 보수적 상향 정책(의도) / 대역폭 추정 실패 |
| 화질 자주 바뀜 | 민감한 추정(의도) / 오버슈트 |
| 버퍼 급감 | 화질 전환에 따른 재요청(의도) / 다운로드 부족 |

의도와 결함은 **지표를 짝지어** 구분한다.

- startup 느림 + rebuffering 0 → 버퍼를 넉넉히 확보한 결과. 의도
- startup 느림 + rebuffering 많음 → 둘 다 나쁨. 결함 의심

따라서 단일 지표로 우열을 매기지 않고 트레이드오프로 제시한다.

### 통계 처리

| 지표 | 방식 |
|---|---|
| startup time | 중앙값 + P95 (평균 사용 금지) |
| rebuffering | ratio + 발생 세션 비율 |
| ABR 반응 지연 | 중앙값 + 분포 |

평균은 나쁜 소수를 숨긴다. 그 소수가 이탈하는 사용자다.

---

## 7. 참고

- S. S. Krishnan, R. K. Sitaraman, "Video Stream Quality Impacts Viewer Behavior", ACM IMC 2012
  — 시작 2초 초과 시 이탈 시작, 이후 1초마다 이탈률 5.8% 증가.
  영상 길이 1%에 해당하는 rebuffer 시 시청 시간 5% 감소. 지표 우선순위 근거
- CTA-2066, Streaming Quality of Experience Events, Properties and Metrics, 2020
  — 지표 정의 및 계산 방식
- CTA-5004, Common Media Client Data (CMCD)
  — 클라이언트 지표를 CDN 요청에 실어 서버 측과 연결하는 표준
- T.-Y. Huang et al., "A Buffer-Based Approach to Rate Adaptation", ACM SIGCOMM 2014
  — 버퍼 기반 ABR. 프로덕션 rebuffer의 20~30%가 용량 추정 오류에서 비롯
- S. Pham et al., "Standards-based Streaming Analytics and its Visualization", ACM MMSys 2021
  — 선행 연구. CMCD·CTA-2066 기반 Grafana 시각화
