export function IntroStrip() {
  return (
    <section className="panel" style={{ fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1rem" }}>
      <p className="muted" style={{ margin: 0 }}>
        <strong>Run</strong> 一次执行 · <strong>Span</strong> 单步 · <strong>树</strong> 嵌套 · <strong>时间线</strong>{" "}
        <span className="mono">started_at</span> · <strong>弱回放</strong> 只读。空列表：{" "}
        <span className="mono">.\scripts\up.ps1</span> 或 <span className="mono">.\examples\demo-rich.ps1</span> ·{" "}
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
          /docs
        </a>
      </p>
    </section>
  );
}
