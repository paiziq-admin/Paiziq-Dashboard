import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../api/client";
import { fetchPaymentExecution } from "../../../api/resources";
import { executionEvidence, evidencePayment } from "../../../../test/fixtures/executionEvidence";
import { ExecutionEvidencePanel } from "./ExecutionEvidencePanel";

vi.mock("../../../api/resources", () => ({ fetchPaymentExecution: vi.fn() }));
const fetchEvidence = vi.mocked(fetchPaymentExecution);

beforeEach(() => { fetchEvidence.mockReset(); });

describe("execution evidence", () => {
  it("keeps unknown results reserved, displays exact scoped amounts, and redacts snapshots", async () => {
    fetchEvidence.mockResolvedValue({ data: executionEvidence() });
    render(<ExecutionEvidencePanel payment={evidencePayment} />);
    expect(await screen.findByText("Unknown", { exact: true })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Do not retry this payment");
    expect(screen.getByText("40.00000001 USD", { exact: true })).toBeVisible();
    expect(screen.getByText("60.00000001 USD", { exact: true })).toBeVisible();
    expect(screen.getByText("20.00000001 USD · held")).toBeVisible();
    expect(screen.getByText("env_1", { exact: true })).toBeVisible();
    expect(screen.getByText("agt_1", { exact: true })).toBeVisible();
    expect(screen.queryByRole("button", { name: /retry|execute|mark failed/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Immutable authorization evidence"));
    expect(screen.getByText("[REDACTED]", { exact: true })).toBeVisible();
    expect(screen.queryByText("never-display-this-key", { exact: false })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Execution event history (1)"));
    expect(screen.getByText("execution_unknown", { exact: true })).toBeVisible();
  });

  it.each([
    ["reserved", "Reserved"], ["submitted", "In progress"], ["confirmed", "Confirmed"], ["failed", "Failed"],
  ] as const)("renders the authoritative %s state", async (status, label) => {
    fetchEvidence.mockResolvedValue({ data: executionEvidence(status) });
    render(<ExecutionEvidencePanel payment={evidencePayment} />);
    expect(await screen.findByText(label, { exact: true })).toBeVisible();
  });

  it("does not infer a charge from an approved payment or a legacy terminal state", async () => {
    const data = executionEvidence();
    data.execution = null;
    data.reservation = null;
    data.events = [];
    fetchEvidence.mockResolvedValue({ data });
    const view = render(<ExecutionEvidencePanel payment={evidencePayment} />);
    expect(await screen.findByText("Not started", { exact: true })).toBeVisible();
    expect(screen.getByText(/Approval alone does not confirm a charge/)).toBeVisible();
    data.legacy_state = "executed";
    fetchEvidence.mockResolvedValue({ data: { ...data } });
    view.rerender(<ExecutionEvidencePanel payment={{ ...evidencePayment, id: "legacy" }} />);
    expect(await screen.findByText("Unverified legacy report")).toBeVisible();
    expect(screen.queryByText("Confirmed", { exact: true })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Execution event history (0)"));
    expect(screen.getByText("No execution events are recorded.")).toBeVisible();
  });

  it.each([
    [404, "Older servers may not support this view"],
    [403, "This API key cannot read execution evidence"],
    [429, "after 12 seconds"],
    [503, "Execution evidence could not be loaded"],
  ])("shows a partial %s error without inventing execution evidence", async (status, body) => {
    fetchEvidence.mockRejectedValue(new ApiError(status as number, "error", "error", 12));
    render(<ExecutionEvidencePanel payment={evidencePayment} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(body as string);
    expect(screen.queryByText("Confirmed", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Not started", { exact: true })).not.toBeInTheDocument();
    fetchEvidence.mockResolvedValue({ data: executionEvidence("confirmed") });
    await userEvent.click(screen.getByRole("button", { name: "Refresh evidence" }));
    expect(await screen.findByText("Confirmed", { exact: true })).toBeVisible();
    expect(fetchEvidence).toHaveBeenCalledTimes(2);
  });

  it("labels a truncated event history without implying older records were deleted", async () => {
    const data = executionEvidence();
    data.events_total = 1001;
    data.events_truncated = true;
    fetchEvidence.mockResolvedValue({ data });
    render(<ExecutionEvidencePanel payment={evidencePayment} />);
    await screen.findByText("Unknown", { exact: true });
    await userEvent.click(screen.getByText("Execution event history (1)"));
    expect(screen.getByText(/Showing the latest 1 of 1001 recorded events/)).toBeVisible();
  });

  it("ignores an old response after the operator opens another payment", async () => {
    let resolveFirst: (value: { data: ReturnType<typeof executionEvidence> }) => void = () => {};
    fetchEvidence.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
    const view = render(<ExecutionEvidencePanel payment={evidencePayment} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading execution evidence");
    fetchEvidence.mockResolvedValue({ data: executionEvidence("confirmed") });
    view.rerender(<ExecutionEvidencePanel payment={{ ...evidencePayment, id: "pay_2" }} />);
    expect(await screen.findByText("Confirmed", { exact: true })).toBeVisible();
    await act(async () => { resolveFirst({ data: executionEvidence("unknown") }); });
    await waitFor(() => expect(screen.queryByText("Unknown", { exact: true })).not.toBeInTheDocument());
  });
});
