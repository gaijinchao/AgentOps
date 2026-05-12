export function IntroStrip() {
  return (
    <section className="panel" style={{ fontSize: "0.88rem", lineHeight: 1.55, marginBottom: "1rem" }}>
      <p style={{ margin: "0 0 0.5rem" }}>
        <strong>Run</strong>：一次执行记录。<strong>Span</strong>：其中一步（如 LLM、工具）。
        <strong>Span 树</strong>看嵌套，<strong>时间线</strong>按 <span className="mono">started_at</span>，
        <strong>弱回放</strong>只读已入库字段，不触发重执行。
      </p>
      <p className="muted" style={{ margin: 0 }}>
        列表为空时：先起后端（如 <span className="mono">docker compose up -d</span>），在仓库根执行{" "}
        <span className="mono">.\examples\demo-rich.ps1</span>，或 Windows 一键{" "}
        <span className="mono">.\scripts\up.ps1</span>。契约见{" "}
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
          OpenAPI /docs
        </a>
        （需 API 在 8000 端口）。
      </p>
    </section>
  );
}
