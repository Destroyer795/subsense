import { describe, it, expect } from 'vitest';
import { compareToCategoryBenchmark } from '../src/data/category-benchmarks';

describe('Category Price Benchmarking Suite', () => {
  it('should flag pricing significantly above category benchmark', () => {
    const comp = compareToCategoryBenchmark('OTT & Streaming', 799); // Benchmark 499
    expect(comp.status).toBe('ABOVE_BENCHMARK');
    expect(comp.percentageDiff).toBeGreaterThan(50);
  });

  it('should flag pricing below category benchmark', () => {
    const comp = compareToCategoryBenchmark('OTT & Streaming', 149);
    expect(comp.status).toBe('BELOW_BENCHMARK');
    expect(comp.percentageDiff).toBeLessThan(0);
  });

  it('should classify pricing within 10% tolerance as AT_BENCHMARK', () => {
    const comp = compareToCategoryBenchmark('Cloud Storage', 130);
    expect(comp.status).toBe('AT_BENCHMARK');
    expect(comp.percentageDiff).toBe(0);
  });
});
