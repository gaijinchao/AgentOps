import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRun, fetchSpans } from "../api";
import { SpanGantt } from "../components/SpanGantt";
import { SpanTimeline } from "../components/SpanTimeline";
import { SpanTree } from "../components/SpanTree";
import { runStatusLabel, spanStatusLabel } from "../labels";
import type { Run, Span } from "../types";

export function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [spans, setSpans] = useState<Span[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    setError(null);
    Promise.all([fetchRun(runId), fetchSpans(runId)])
      .then(([r, s]) => {
        if (!cancelled) {
          setRun(r);
          setSpans(s);
          if (s.length > 0) setSelectedId(s[0].id);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const selected = useMemo(
    () => spans?.find((x) => x.id === selectedId) ?? null,
    [spans, selectedId],
  );

  if (!runId) {
    return <p className="muted">缺少运行 ID。</p>;
  }

  if (error) {
    return (
      <div className="panel">
        <p>{error}</p>
        <Link to="/">返回运行列表</Link>
      </div>
    );
  }

  if (!run || spans === null) {
    return <p className="muted">加载中…</p>;
  }

  return (
    <div>
      <p>
        <Link to="/">← 运行列表</Link>
      </p>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>运行详情</h2>
        <p className="mono muted">{run.id}</p>
        <p>
          <strong>状态：</strong>
          {runStatusLabel(run.status)}
        </p>
        <p>
          <strong>external_ref：</strong>
          {run.external_ref ?? "—"}
        </p>
        <p>
          <strong>开始 / 结束：</strong>
          {run.started_at ?? "—"} → {run.ended_at ?? "—"}
        </p>
        <p>
          <strong>输入摘要：</strong>
          {run.input_summary ?? "—"}
        </p>
        <p>
          <strong>输出摘要：</strong>
          {run.output_summary ?? "—"}
        </p>
        {run.error_summary ? (
          <p>
            <strong>错误摘要：</strong>
            {run.error_summary}
          </p>
        ) : null}
      </div>

      <div className="grid-two">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Span 树</h3>
          <SpanTree spans={spans} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>时间线</h3>
          <p className="muted">按 started_at 排序；无开始时间的条目排在后面。</p>
          <SpanTimeline spans={spans} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>时间占比（相对 Run）</h3>
        <p className="muted">基于 Run 与各 Span 的 started_at / ended_at 估算；无时间戳时可能较粗。</p>
        <SpanGantt run={run} spans={spans} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>弱回放（只读）</h3>
        {!selected ? (
          <p className="muted">请在 Span 树、时间线或甘特条中选择一个节点。</p>
        ) : (
          <div className="mono replay">
            <p>
              <strong>{selected.name}</strong>（{selected.type}）— {spanStatusLabel(selected.status)}
            </p>
            <p>开始时间（started_at）：{selected.started_at ?? "无"}</p>
            <p>结束时间（ended_at）：{selected.ended_at ?? "无"}</p>
            {selected.error_message ? (
              <p className="replay-error">
                错误信息（error_message）：{selected.error_message}
              </p>
            ) : null}
            <details className="json-details" open>
              <summary>属性（attributes）</summary>
              <pre className="json-pre">{JSON.stringify(selected.attributes ?? {}, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
