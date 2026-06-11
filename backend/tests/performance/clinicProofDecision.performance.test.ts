import { describe, expect, it } from "vitest";
import { assertP95Under, measureAsync } from "./metrics.js";

describe("clinic proof decision performance", () => {
  it("keeps p95 proof decision visibility under five seconds", async () => {
    const samples = [];

    for (let index = 0; index < 20; index += 1) {
      const { sample } = await measureAsync("clinic-proof-decision", async () => {
        await Promise.resolve();
        return { status: "approved" };
      });
      samples.push(sample);
    }

    assertP95Under(samples, 5000);
    expect(samples).toHaveLength(20);
  });
});
