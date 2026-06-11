import { performance } from "node:perf_hooks";

export interface TimingSample {
  name: string;
  durationMs: number;
}

export async function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<{ result: T; sample: TimingSample }> {
  const start = performance.now();
  const result = await operation();
  return {
    result,
    sample: {
      name,
      durationMs: performance.now() - start,
    },
  };
}

export function percentile(samples: number[], targetPercentile: number): number {
  if (samples.length === 0) {
    return 0;
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.ceil((targetPercentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

export function assertP95Under(samples: TimingSample[], budgetMs: number): void {
  const p95 = percentile(samples.map((sample) => sample.durationMs), 95);
  if (p95 > budgetMs) {
    throw new Error(`p95 exceeded budget: ${p95.toFixed(2)}ms > ${budgetMs}ms`);
  }
}
