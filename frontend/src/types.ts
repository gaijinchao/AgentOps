export type RunStatus = "pending" | "running" | "succeeded" | "failed";
export type SpanStatus = "running" | "succeeded" | "failed";

export interface Run {
  id: string;
  status: RunStatus;
  started_at: string | null;
  ended_at: string | null;
  input_summary: string | null;
  output_summary: string | null;
  error_summary: string | null;
  external_ref: string | null;
  created_at: string;
}

export interface Span {
  id: string;
  run_id: string;
  parent_span_id: string | null;
  type: string;
  name: string;
  status: SpanStatus;
  started_at: string | null;
  ended_at: string | null;
  attributes: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}
