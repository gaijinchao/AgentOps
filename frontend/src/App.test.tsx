import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

describe("App", () => {
  it("renders title and intro", () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(screen.getByRole("heading", { name: /AgentOps/i })).toBeInTheDocument();
    expect(screen.getByText(/弱回放/)).toBeInTheDocument();
  });
});
