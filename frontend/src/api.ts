import type { Run, Span } from "./types";

const base = () => import.meta.env.VITE_API_URL ?? "";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export async function fetchRuns(): Promise<Run[]> {
  const res = await fetch(`${base()}/v1/runs`);
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
