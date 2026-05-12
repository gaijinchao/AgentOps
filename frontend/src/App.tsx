import { Navigate, Route, Routes } from "react-router-dom";
import { IntroStrip } from "./components/IntroStrip";
import { RunDetail } from "./pages/RunDetail";
import { RunList } from "./pages/RunList";

export default function App() {
  return (
    <div className="layout">
      <header style={{ marginBottom: "0.75rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.35rem" }}>AgentOps</h1>
        <p className="muted" style={{ margin: "0.25rem 0 0" }}>
          HTTP 上报 Run / Span，本页查看列表与链路
        </p>
      </header>
      <IntroStrip />
      <Routes>
        <Route path="/" element={<RunList />} />
        <Route path="/runs/:runId" element={<RunDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
