import { useMemo } from "react";
import { spanStatusLabel } from "../labels";
import type { Run, Span } from "../types";

function parseMs(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function timelineSort(a: Span, b: Span): number {
  const an = a.started_at == null ? 1 : 0;
  const bn = b.started_at == null ? 1 : 0;
  if (an !== bn) return an - bn;
  if (a.started_at && b.started_at) {
    return a.started_at.localeCompare(b.started_at);
  }
  return a.created_at.localeCompare(b.created_at);
}

function boundsFor(run: Run, spans: Span[]): { t0: number; spanMs: number } | null {
  const pts: number[] = [];
  for (const t of [parseMs(run.started_at), parseMs(run.ended_at)]) {
    if (t !== null) pts.push(t);
  }
  for (const s of spans) {
    for (const t of [parseMs(s.started_at), parseMs(s.ended_at)]) {
      if (t !== null) pts.push(t);
    }
  }
  if (pts.length === 0) return null;
  const t0 = Math.min(...pts);
  const t1 = Math.max(...pts);
  const spanMs = Math.max(t1 - t0, 1);
  return { t0, spanMs };
}

function fmtOffset(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  if (Math.abs(ms) < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

interface Props {
  run: Run;
  spans: Span[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SpanGantt({ run, spans, selectedId, onSelect }: Props) {
  const bounds = useMemo(() => boundsFor(run, spans), [run, spans]);
  const ordered = useMemo(() => [...spans].sort(timelineSort), [spans]);

  if (!bounds) {
    return <p className="muted">暂无可用时间戳，无法绘制甘特条。</p>;
  }

  const { t0, spanMs } = bounds;

  return (
    <div className="gantt">
      {ordered.map((s) => {
        const st = parseMs(s.started_at);
        const en = parseMs(s.ended_at);
        const leftMs = st !== null ? st - t0 : 0;
        const barStart = st !== null ? (leftMs / spanMs) * 100 : 0;
        let barW = 0;
        if (st !== null && en !== null) {
          barW = Math.max(((en - st) / spanMs) * 100, 0.8);
        } else if (st !== null) {
          barW = Math.max(((t0 + spanMs - st) / spanMs) * 100 * 0.08, 0.8);
        } else {
          barW = 0.8;
        }
        const selected = selectedId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`gantt-row${selected ? " gantt-row-selected" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <div className="gantt-meta">
              <div className="gantt-title">
                <span className="muted">{s.type}</span> · {s.name}{" "}
                <span className="muted">（{spanStatusLabel(s.status)}）</span>
              </div>
              <div className="muted gantt-offset">
                相对起点 {fmtOffset(leftMs)}
                {st !== null && en !== null ? ` · 时长 ${fmtOffset(en - st)}` : null}
              </div>
            </div>
            <div className="gantt-track" aria-hidden>
              <span
                className={`gantt-bar gantt-bar-${s.status}`}
                style={{ marginLeft: `${barStart}%`, width: `${Math.min(barW, 100 - barStart)}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
