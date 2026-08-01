## 관찰 노트

**저대역폭 환경에서의 프로토콜별 적응 패턴:** Live 스트림(hls_live 720p만, dash_live 360p만 제공)은 단일 렌디션 제약으로 인해 kbps600에서 rebuffer ratio 급증(hls_live hlsjs: 0.0045→0.0371, shaka: 0→0.0805). 이는 **대역폭이 유일한 렌디션의 비트레이트에 미달하는 상황**으로, 선택지가 없어 rebuffer로 나타난 것이 **의도된 행동**. 반면 VOD 스트림은 해상도 적응(hls_vod hlsjs: 1037p→234p)으로 rebuffer 최소화. **예외:** hls_vod hlsjs에서 mbps1_5 rebuffer(0.0133)가 kbps600(0)보다 높음 — 대역폭 절벽 부근에서 ABR 진동의 전형적 현상. **결함 없음:** 모든 관찰이 프로토콜 및 네트워크 제약 하의 예상된 행동.
