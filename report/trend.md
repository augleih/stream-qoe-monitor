# 일일 스모크 추이

매일 06:00 KST CI가 측정한 hls_vod × hlsjs (무제한 네트워크, 30초 관찰) 추이.
CI는 결과 아티팩트만 쌓고, 이 리포트는 로컬에서 `npm run trend`를 수동 실행해야
갱신된다(gh CLI 필요).

![trend](charts/trend_startup.svg)

| date | startup_ms | rebuffer_ratio | error |
|---|---|---|---|
| 2026-08-02 | 623 | 0 | — |
| 2026-08-02 | 1125 | 0 | — |
