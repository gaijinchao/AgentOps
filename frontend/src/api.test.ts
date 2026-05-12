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
              external_ref: null,
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

  it("passes list query params", async () => {
    const fetchMock = vi.fn(async (url: string | Request) => {
      expect(String(url)).toContain("limit=10");
      expect(String(url)).toContain("offset=5");
      expect(String(url)).toContain("status=running");
      expect(String(url)).toContain("external_ref=abc");
      return new Response("[]", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    try {
      await fetchRuns({ limit: 10, offset: 5, status: "running", external_ref: "abc" });
      expect(fetchMock).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
