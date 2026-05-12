import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRuns } from "../api";
import type { RunListQuery } from "../api";
import { runStatusLabel } from "../labels";
import type { Run, RunStatus } from "../types";

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

const statusOptions: Array<{ value: "" | RunStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "pending", label: runStatusLabel("pending") },
  { value: "running", label: runStatusLabel("running") },
  { value: "succeeded", label: runStatusLabel("succeeded") },
  { value: "failed", label: runStatusLabel("failed") },
];

export function RunList() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draftRef, setDraftRef] = useState("");
  const [draftStatus, setDraftStatus] = useState<"" | RunStatus>("");
  const [draftLimit, setDraftLimit] = useState(50);

  const [appliedRef, setAppliedRef] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<"" | RunStatus>("");
  const [pageSize, setPageSize] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setRuns(null);
    const q: RunListQuery = { limit: pageSize, offset };
    if (appliedStatus) q.status = appliedStatus;
    if (appliedRef.trim()) q.external_ref = appliedRef.trim();
    fetchRuns(q)
      .then((r) => {
        if (!cancelled) setRuns(r);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [appliedRef, appliedStatus, pageSize, offset]);

  const applyFilters = () => {
    setAppliedRef(draftRef);
    setAppliedStatus(draftStatus);
    setPageSize(Math.min(200, Math.max(1, draftLimit)));
    setOffset(0);
  };

  if (error) {
    return (
      <div className="panel">
        <p>无法加载运行列表：{error}</p>
        <p className="muted">API 不可达（8000 或 VITE_API_URL）。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="panel filter-bar">
        <div className="filter-grid">
          <label className="field">
            <span className="field-label">external_ref</span>
            <input
              className="input"
              value={draftRef}
              onChange={(e) => setDraftRef(e.target.value)}
              placeholder="精确匹配，可留空"
              aria-label="external_ref"
            />
          </label>
          <label className="field">
            <span className="field-label">状态</span>
            <select
              className="input"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value as "" | RunStatus)}
              aria-label="status"
            >
              {statusOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">每页条数</span>
            <input
              className="input"
              type="number"
              min={1}
              max={200}
              value={draftLimit}
              onChange={(e) => setDraftLimit(Number(e.target.value) || 50)}
              aria-label="limit"
            />
          </label>
          <div className="field field-actions">
            <button type="button" className="btn primary" onClick={applyFilters}>
              应用筛选
            </button>
          </div>
        </div>
        <p className="muted filter-hint">offset {offset}，每页 {pageSize}。修改条件后请先点「应用筛选」。</p>
        <div className="pager">
          <button type="button" className="btn" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))}>
            上一页
          </button>
          <button type="button" className="btn" disabled={runs !== null && runs.length < pageSize} onClick={() => setOffset(offset + pageSize)}>
            下一页
          </button>
        </div>
      </div>

      <div className="panel">
        {runs === null ? (
          <p className="muted">加载中…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>状态</th>
                <th>external_ref</th>
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
                  <td className="mono">{r.external_ref ?? "—"}</td>
                  <td className="mono">{r.created_at}</td>
                  <td>{r.input_summary ?? "—"}</td>
                  <td>
                    <Link to={`/runs/${r.id}`}>打开</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {runs && runs.length === 0 ? <p className="muted">无数据。</p> : null}
      </div>
    </div>
  );
}
