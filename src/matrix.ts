import { STREAMS } from './streams.js';
import type { PlayerName, StreamDef } from './types.js';

// hls.js는 HLS 전용, dash.js는 DASH 전용, Shaka는 둘 다 — 유효 조합 8개
export const PLAYER_PROTOCOLS: Record<PlayerName, ('hls' | 'dash')[]> = {
  hlsjs: ['hls'],
  dashjs: ['dash'],
  shaka: ['hls', 'dash'],
};

export function validCombos(): { player: PlayerName; stream: StreamDef }[] {
  const out: { player: PlayerName; stream: StreamDef }[] = [];
  for (const stream of STREAMS) {
    for (const player of Object.keys(PLAYER_PROTOCOLS) as PlayerName[]) {
      if (PLAYER_PROTOCOLS[player].includes(stream.proto)) out.push({ player, stream });
    }
  }
  return out;
}
