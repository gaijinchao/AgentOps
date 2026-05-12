import type { RunStatus, SpanStatus } from "./types";

export function runStatusLabel(status: RunStatus): string {
  switch (status) {
    case "pending":
      return "等待中";
    case "running":
      return "运行中";
    case "succeeded":
      return "成功";
    case "failed":
      return "失败";
    default:
      return status;
  }
}

export function spanStatusLabel(status: SpanStatus): string {
  switch (status) {
    case "running":
      return "运行中";
    case "succeeded":
      return "成功";
    case "failed":
      return "失败";
    default:
      return status;
  }
}
