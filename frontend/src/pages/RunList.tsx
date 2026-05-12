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
        <p className="muted">请确认 API 在 8000 端口或设置 VITE_API_URL。见首页上方说明。</p>
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
      {runs.length === 0 ? <p className="muted">暂无数据。按首页说明写入演示后刷新。</p> : null}
    </div>
  );
}
