import { describe, expect, it, vi } from "vitest";
import { fetchRuns } from "./api";

describe("fetchRuns", () => {
  it("parses run list JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              id: "11111111-1111-1111-1111-111111111111",
              status: "running",
              started_at: null,
              ended_at: null,
              input_summary: "hi",
              output_summary: null,
              error_summary: null,
              created_at: "2026-05-11T10:00:00Z",
            },
          ]),
          { status: 200 },
        ),
      ),
    );
    try {
      const runs = await fetchRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0].input_summary).toBe("hi");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
