# 지표 정의 (CTA-2066 매핑)

측정 기준점 t0 = 플레이어 라이브러리 load 호출 직전 (`performance.now()`).
모든 `*_ms`는 t0 기준 경과 시간. 구현: [player/qoe.js](../player/qoe.js).

| 지표 | 정의 | 측정 방법 | CTA-2066 대응 |
|---|---|---|---|
| manifest_loaded_ms | 첫 매니페스트(.m3u8/.mpd) 수신 완료 | Resource Timing responseEnd | Playback 준비 단계 |
| first_segment_ms | 첫 미디어 세그먼트 수신 완료 (init 세그먼트 포함) | Resource Timing responseEnd | 〃 |
| metadata_ms | 디코더가 규격 파악 완료 | video `loadedmetadata` | 〃 |
| first_frame_ms / startup_ms | 첫 프레임이 실제 화면에 렌더 | `requestVideoFrameCallback` | Video Start Time |
| rebuffer_count / time / ratio | 첫 프레임 이후 재생 정지 구간 (초기 버퍼링 제외). ratio = 정지 시간 / 첫 프레임 이후 관찰 시간 | video `waiting`→`playing/timeupdate` | Rebuffering Events / Ratio |
| dropped_ratio | 드롭 프레임 / 디코드 프레임 (관찰 종료 시점 누적) | `getVideoPlaybackQuality()` | Frame Drops |
| time_weighted_height | 각 해상도에 머문 시간으로 가중한 평균 videoHeight | 1초 샘플링 | Average Bitrate 계열의 해상도 근사 |
| quality_switch (타임라인) | ABR 전환 시각과 전환 후 높이/비트레이트 | 라이브러리별 이벤트 (LEVEL_SWITCHED 등) | Rendition Changes |

## breakdown (구간별 소요시간)

`startup_ms`의 내역을 4구간으로 쪼갠 값. t0부터 `manifest_loaded_ms`까지(`manifest`),
그 다음 `first_segment_ms`까지(`to_first_segment`), 그 다음 `metadata_ms`까지
(`to_metadata`), 마지막으로 `first_frame_ms`까지(`to_first_frame`) — 각 구간은
자신의 양 끝 지표가 모두 있을 때만 계산되며, 하나라도 null이면 해당 구간만
null이 된다 (앞 구간의 null이 뒤 구간으로 전파되지는 않는다).
"startup이 느리다"는 한 숫자가 아니라 어느 구간이 느린지 짚기 위한 값.

## 라이브러리별 이벤트 매핑 (quality_switch)

| 라이브러리 | 이벤트 | 필드 |
|---|---|---|
| hls.js | `Hls.Events.LEVEL_SWITCHED` | `hls.levels[data.level]`의 height/bitrate |
| dash.js | `MediaPlayer.events.QUALITY_CHANGE_RENDERED` | v5 `e.newRepresentation.height/bandwidth`, v4 `e.newQuality`(인덱스) — 둘 다 대응 |
| Shaka | `adaptation` | `getVariantTracks().find(t => t.active)`의 height/bandwidth |

세 이벤트는 의미가 다르다 (아래 "알려진 한계" 참고). `abr_reaction_ms`,
`오버슈트 횟수`, `recovered` 판정(결함 시나리오)은 이 `quality_switch` 타임라인을
근거로 `src/aggregate.ts`에서 계산한다.

## 알려진 한계

- first_segment는 URL 확장자 휴리스틱으로 분류 — init/미디어 세그먼트를 구분하지 않는다
- time_weighted_height는 1초 샘플링 근사치다
- quality_switch 이벤트 의미는 라이브러리마다 다르다 ("전환 결정" vs "렌더 반영") —
  플레이어 간 비교는 video element 기반 지표(샘플의 height)를 우선한다
- rebuffer_ratio는 60초 관찰 창 안에서도 회차별(rep)로 편차가 크다. 표에서
  `rebuffer ratio`(회차 중앙값)와 `rebuffer 세션%`(끊김이 1회라도 발생한 회차 비율)를
  나란히 보는 것은 이 편차를 감추지 않기 위함이다 — ratio 중앙값이 0이어도
  세션%가 0이 아닐 수 있다

## 시나리오 트리거 기준 (재생 위치 앵커)

결함·조건 변화 시나리오(`src/scenarios.ts`)의 발동 시점은 벽시계나 요청 횟수가 아니라
**재생 위치(`video.currentTime`)** 를 기준으로 삼는다. `page.waitForFunction`으로
`currentTime`이 지정된 초(예: 15초, 30초)에 도달할 때까지 대기한 뒤 결함을 무장(arm)한다
— HLS/DASH는 세그먼트 길이·매니페스트 구조가 달라 벽시계나 N번째 요청 기준으로는
프로토콜마다 발동 시점이 크게 어긋난다(요청 횟수 기준이던 1단계에서 같은 시나리오가
DASH는 t≈167ms(재생 직후), HLS는 t≈50s에 발동해 약 50초 어긋났다). VOD 스트림은
`currentTime`이 0부터 시작해 이 앵커가 의도대로 작동함을 검증했다 — 재설계 후
rep 0 검증에서 두 프로토콜의 트리거 시각 차이가 Δ475ms까지 좁혀졌다. **라이브 스트림은 다르다** —
`currentTime`이 재생 시작부터 세는 상대값이 아니라 스트림 타임라인상의 절대 위치라,
메타데이터 로드 직후 이미 앵커 임계값을 넘는 경우가 흔하다. 이 때문에 라이브 대상
시나리오(`manifest_fail`)는 "재생 안정 구간 이후 결함"이 아니라 사실상 "시작 구간
결함"으로 발동한다 — 자세한 근거: [report/observations.md](../report/observations.md).

## CMCD (Common Media Client Data, CTA-5004)

`&cmcd=1` 쿼리 파라미터로 활성화되는 opt-in 기능. 활성화 시 media request URL의 query
parameter에 클라이언트 측정 데이터(`CMCD` query param으로 인코딩)를 포함시키며, CDN 로그와
클라이언트 지표를 연결하는 업계 표준(CTA-5004). 세 플레이어 모두 query-mode로 구현
(header-mode 제외, Resource Timing으로 검증 가능). **기본값은 off** — 기존 120회 베이스라인
데이터셋(Task 1-10 결과)과의 일관성을 유지하기 위해 opt-in으로 설계. 성능 임팩트 평가와
CDN 연계 분석이 필요한 경우에만 활성화.
