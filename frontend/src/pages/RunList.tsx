import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRuns } from "../api";
import { runStatusLabel } from "../labels";
import type { Run } from "../types";

function statusClass(status: Run["status"]): string {
  switch (status) {
    case "running":
      return "badge badge-running";
    case "succeeded":
      return "badge badge-succeeded";
    case "failed":
      return "badge badge-failed";
    default:
      return "badge badge-pending";
  }
}

export function RunList() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRuns()
      .then((r) => {
        if (!cancelled) setRuns(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="panel">
        <p>无法加载运行列表：{error}</p>
        <p className="muted">API 不可达（8000 或 VITE_API_URL）。</p>
      </div>
    );
  }

  if (runs === null) {
    return <p className="muted">加载中…</p>;
  }

  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th>状态</th>
            <th>创建时间</th>
            <th>输入摘要</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id}>
              <td>
                <span className={statusClass(r.status)}>{runStatusLabel(r.status)}</span>
              </td>
              <td className="mono">{r.created_at}</td>
              <td>{r.input_summary ?? "—"}</td>
              <td>
                <Link to={`/runs/${r.id}`}>打开</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {runs.length === 0 ? <p className="muted">无数据。</p> : null}
    </div>
  );
}
