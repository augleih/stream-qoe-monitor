import type { NetworkName } from './types.js';

export interface NetworkConditions {
  offline: boolean;
  latency: number;            // ms
  downloadThroughput: number; // bytes/sec, -1 = 무제한
  uploadThroughput: number;
}

// 단계는 bipbop 래더(232k/650k/1M/2M)에 맞춤 — scratch.md 4장
export const NETWORKS: Record<NetworkName, NetworkConditions> = {
  unlimited: { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
  mbps1_5: { offline: false, latency: 40, downloadThroughput: 1_500_000 / 8, uploadThroughput: 750_000 / 8 },
  kbps600: { offline: false, latency: 40, downloadThroughput: 600_000 / 8, uploadThroughput: 300_000 / 8 },
};

export const OFFLINE: NetworkConditions = {
  offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
};
