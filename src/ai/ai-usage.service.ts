import { Injectable } from '@nestjs/common';

export type AiEndpointKey = 'summarize' | 'translate' | 'analyze' | 'generate';

@Injectable()
export class AiUsageService {
  private totalRequests = 0;
  private readonly byEndpoint = new Map<string, number>();
  private readonly latencySumMs = new Map<string, number>();
  private readonly latencyCount = new Map<string, number>();
  private promptTokens = 0;
  private candidateTokens = 0;
  private totalTokens = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  recordRequest(
    endpoint: AiEndpointKey,
    durationMs: number,
    usage?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    },
  ): void {
    this.totalRequests++;
    this.byEndpoint.set(endpoint, (this.byEndpoint.get(endpoint) ?? 0) + 1);
    this.latencySumMs.set(
      endpoint,
      (this.latencySumMs.get(endpoint) ?? 0) + durationMs,
    );
    this.latencyCount.set(endpoint, (this.latencyCount.get(endpoint) ?? 0) + 1);
    if (usage?.promptTokenCount != null) {
      this.promptTokens += usage.promptTokenCount;
    }
    if (usage?.candidatesTokenCount != null) {
      this.candidateTokens += usage.candidatesTokenCount;
    }
    if (usage?.totalTokenCount != null) {
      this.totalTokens += usage.totalTokenCount;
    }
  }

  getSnapshot() {
    const byEndpointObj: Record<string, number> = {};
    for (const [k, v] of this.byEndpoint) byEndpointObj[k] = v;

    const averageLatencyMsByEndpoint: Record<string, number> = {};
    for (const [ep, sum] of this.latencySumMs) {
      const n = this.latencyCount.get(ep) ?? 1;
      averageLatencyMsByEndpoint[ep] = Math.round(sum / n);
    }

    const hits = this.cacheHits;
    const misses = this.cacheMisses;
    const cacheLookups = hits + misses;

    return {
      totalRequests: this.totalRequests,
      byEndpoint: byEndpointObj,
      tokens: {
        prompt: this.promptTokens,
        candidates: this.candidateTokens,
        total: this.totalTokens,
      },
      averageLatencyMsByEndpoint,
      cache: {
        hits,
        misses,
        hitRatio: cacheLookups === 0 ? null : hits / cacheLookups,
      },
    };
  }
}
