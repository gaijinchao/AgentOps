import type { Run, RunStatus, Span } from "./types";

const base = () => import.meta.env.VITE_API_URL ?? "";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export type RunListQuery = {
  limit?: number;
  offset?: number;
  status?: RunStatus;
  external_ref?: string;
};

export async function fetchRuns(q?: RunListQuery): Promise<Run[]> {
  const params = new URLSearchParams();
  if (q?.limit != null) params.set("limit", String(q.limit));
  if (q?.offset != null) params.set("offset", String(q.offset));
  if (q?.status) params.set("status", q.status);
  if (q?.external_ref) params.set("external_ref", q.external_ref);
  const qs = params.toString();
  const url = qs ? `${base()}/v1/runs?${qs}` : `${base()}/v1/runs`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`获取运行列表失败（HTTP ${res.status}）`);
  }
  return parseJson<Run[]>(res);
}

export async function fetchRun(id: string): Promise<Run> {
  const res = await fetch(`${base()}/v1/runs/${id}`);
  if (!res.ok) {
    throw new Error(`获取运行详情失败（HTTP ${res.status}）`);
  }
  return parseJson<Run>(res);
}

export async function fetchSpans(runId: string): Promise<Span[]> {
  const res = await fetch(`${base()}/v1/runs/${runId}/spans`);
  if (!res.ok) {
    throw new Error(`获取 Span 列表失败（HTTP ${res.status}）`);
  }
  return parseJson<Span[]>(res);
}
