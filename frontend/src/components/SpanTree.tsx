import { spanStatusLabel } from "../labels";
import type { Span } from "../types";

function spanSort(a: Span, b: Span): number {
  const an = a.started_at == null ? 1 : 0;
  const bn = b.started_at == null ? 1 : 0;
  if (an !== bn) return an - bn;
  if (a.started_at && b.started_at) {
    return a.started_at.localeCompare(b.started_at);
  }
  return a.name.localeCompare(b.name);
}

function childrenOf(spans: Span[], parentId: string | null): Span[] {
  return spans.filter((s) => s.parent_span_id === parentId).sort(spanSort);
}

interface Props {
  spans: Span[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TreeNode({
  span,
  spans,
  selectedId,
  onSelect,
}: {
  span: Span;
  spans: Span[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const kids = childrenOf(spans, span.id);
  return (
    <li>
      <button
        type="button"
        className={selectedId === span.id ? "selected" : undefined}
        onClick={() => onSelect(span.id)}
      >
        <span className="muted">{span.type}</span> · {span.name}{" "}
        <span className="muted">（{spanStatusLabel(span.status)}）</span>
      </button>
      {kids.length > 0 ? (
        <ul>
          {kids.map((c) => (
            <TreeNode
              key={c.id}
              span={c}
              spans={spans}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function SpanTree({ spans, selectedId, onSelect }: Props) {
  const roots = childrenOf(spans, null);
  if (roots.length === 0) {
    return <p className="muted">暂无 Span。</p>;
  }
  return (
    <ul className="tree">
      {roots.map((s) => (
        <TreeNode
          key={s.id}
          span={s}
          spans={spans}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
