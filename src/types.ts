export type PlayerName = 'hlsjs' | 'dashjs' | 'shaka';
export type NetworkName = 'unlimited' | 'mbps1_5' | 'kbps600';

export interface StreamDef {
  id: string;
  proto: 'hls' | 'dash';
  live: boolean;
  url: string;
  note?: string;
}

export interface RunSpec {
  player: PlayerName;
  stream: StreamDef;
  network: NetworkName;
  rep: number;
  observeMs: number;
  scenario?: string;
}

export interface TimelineEvent {
  t: number; // t0 기준 경과 ms
  type: string;
  detail?: unknown;
}

export interface Sample {
  t: number;
  ct: number;        // video.currentTime (초)
  buffer_s: number;  // 현재 위치 앞의 버퍼 (초)
  height: number;    // videoHeight
  dropped: number;   // 누적 드롭 프레임
  decoded: number;   // 누적 디코드 프레임
}

export interface Metrics {
  manifest_loaded_ms: number | null;
  first_segment_ms: number | null;
  metadata_ms: number | null;
  first_frame_ms: number | null;
  startup_ms: number | null;
  breakdown: {
    manifest: number | null;
    to_first_segment: number | null;
    to_metadata: number | null;
    to_first_frame: number | null;
  };
  rebuffer_count: number;
  rebuffer_time_ms: number;
  rebuffer_ratio: number | null;
  dropped_ratio: number | null;
  time_weighted_height: number | null;
}

export interface RunResult {
  runId: string;
  player: PlayerName;
  streamId: string;
  streamUrl: string;
  network: NetworkName;
  rep: number;
  scenario: string | null;
  startedAt: string; // ISO
  libVersion: string;
  observeMs: number;
  metrics: Metrics;
  timeline: TimelineEvent[];
  samples: Sample[];
  error: string | null;
}
