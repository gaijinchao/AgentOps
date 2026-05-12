import { spanStatusLabel } from "../labels";
import type { Span } from "../types";

function timelineSort(a: Span, b: Span): number {
  const an = a.started_at == null ? 1 : 0;
  const bn = b.started_at == null ? 1 : 0;
  if (an !== bn) return an - bn;
  if (a.started_at && b.started_at) {
    return a.started_at.localeCompare(b.started_at);
  }
  return a.created_at.localeCompare(b.created_at);
}

interface Props {
  spans: Span[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SpanTimeline({ spans, selectedId, onSelect }: Props) {
  const ordered = [...spans].sort(timelineSort);
  if (ordered.length === 0) {
    return <p className="muted">暂无 Span。</p>;
  }
  return (
    <div>
      {ordered.map((s) => (
        <div key={s.id} className="timeline-item">
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
              width: "100%",
            }}
            className={selectedId === s.id ? "mono selected" : undefined}
            onClick={() => onSelect(s.id)}
          >
            <strong>{s.started_at ?? "—"}</strong>
            <div>
              <span className="muted">{s.type}</span> · {s.name}{" "}
              <span className="muted">（{spanStatusLabel(s.status)}）</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
