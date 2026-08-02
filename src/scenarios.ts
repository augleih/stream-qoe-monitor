import type { CDPSession, Page } from 'playwright';
import { NETWORKS, OFFLINE } from './networks.js';
import type { Scenario } from './runner.js';

const SEG_RE = /\.(ts|mp4|m4s|m4a|m4v|cmfv|cmfa|aac)(\?|$)/;
const MANIFEST_RE = /\.(m3u8|mpd)(\?|$)/;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function mark(page: Page, name: string): Promise<void> {
  await page.evaluate(
    n => (window as never as { __qoe: { mark(x: string): void } }).__qoe.mark(n),
    name,
  ).catch(() => {});
}

// 모두 결정적: 세그먼트/매니페스트 결함은 요청 "횟수" 기준, 대역폭/차단은 고정 시각
export const SCENARIOS: Record<string, Scenario> = {
  // 30초 시점에 현재 프로파일 → 600kbps 하강. ABR 하향 반응 측정용
  bw_drop: {
    run: async (page, cdp: CDPSession) => {
      await sleep(30_000);
      await cdp.send('Network.emulateNetworkConditions', NETWORKS.kbps600);
      await mark(page, 'bw_drop_600k');
    },
  },

  // 30초 시점에 현재 프로파일 → 무제한 회복. 상향 전환 지연 측정용 (--network kbps600으로 시작)
  bw_recover: {
    run: async (page, cdp: CDPSession) => {
      await sleep(30_000);
      await cdp.send('Network.emulateNetworkConditions', NETWORKS.unlimited);
      await mark(page, 'bw_recover_unlimited');
    },
  },

  // 8번째 세그먼트 요청에 404 1회 — 재시도 여부 확인
  seg_404: {
    setup: async page => {
      let count = 0;
      await page.route(SEG_RE, async route => {
        count += 1;
        if (count === 8) {
          await mark(page, 'seg_404_injected');
          return route.fulfill({ status: 404, body: '' });
        }
        return route.fallback();
      });
    },
  },

  // 8번째 세그먼트 요청을 5초 지연 — abandon 동작 확인
  seg_delay: {
    setup: async page => {
      let count = 0;
      await page.route(SEG_RE, async route => {
        count += 1;
        if (count === 8) {
          await mark(page, 'seg_delay_5s');
          await sleep(5_000);
        }
        return route.fallback();
      });
    },
  },

  // 45초 시점 네트워크 3초 완전 차단 — 자동 재개 확인
  offline_3s: {
    run: async (page, cdp, spec) => {
      await sleep(45_000);
      await cdp.send('Network.emulateNetworkConditions', OFFLINE);
      await mark(page, 'offline_start');
      await sleep(3_000);
      await cdp.send('Network.emulateNetworkConditions', NETWORKS[spec.network]);
      await mark(page, 'offline_end');
    },
  },

  // 2~4번째 매니페스트 요청 차단 (라이브 갱신 실패) — 재생 유지 확인
  manifest_fail: {
    setup: async page => {
      let count = 0;
      await page.route(MANIFEST_RE, async route => {
        count += 1;
        if (count >= 2 && count <= 4) {
          await mark(page, `manifest_abort_${count}`);
          return route.abort('failed');
        }
        return route.fallback();
      });
    },
  },
};
