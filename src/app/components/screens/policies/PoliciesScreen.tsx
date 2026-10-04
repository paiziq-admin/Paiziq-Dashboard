import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { FileDiff, FlaskConical, History, Plus, Save } from "lucide-react";
import { ApiError } from "../../../api/client";
import { fetchPolicyPage } from "../../../api/admin";
import {
  comparePolicyVersions,
  createPolicy,
  fetchPolicy,
  fetchPolicyVersions,
  publishPolicy,
  rollbackPolicy,
  simulatePolicy,
  updatePolicyDraft,
} from "../../../api/resources";
import type {
  Policy,
  PolicyDocument,
  PolicyVersion,
  SimulationResult,
} from "../../../api/types";
import {
  ActionButton,
  EmptyState,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  SegmentedTabs,
  StatusBadge,
} from "../../primitives";
import {
  CapabilityNotice,
  EnvironmentSelect,
  ErrorPanel,
  LoadingPanel,
  errorMessage,
  formatJsonValue,
  formatTimestamp,
  useAdminEnvironments,
} from "../admin/AdminSupport";

const tabs = [
  { label: "Draft", value: "draft" },
  { label: "Lists", value: "lists" },
  { label: "Simulator", value: "simulator" },
  { label: "Versions", value: "versions" },
  { label: "Diff", value: "diff" },
];

type DiffResult = Awaited<ReturnType<typeof comparePolicyVersions>>["data"];
type Feedback = { tone: "success" | "danger" | "warning"; message: string } | null;

export function PoliciesScreen() {
  const environment = useAdminEnvironments();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyTotal, setPolicyTotal] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [draft, setDraft] = useState<PolicyDocument | null>(null);
  const [draftReason, setDraftReason] = useState("");
  const [tab, setTab] = useState("draft");
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState<unknown>(null);
  const [detailError, setDetailError] = useState<unknown>(null);
  const [mutation, setMutation] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [createName, setCreateName] = useState("");
  const [listReload, setListReload] = useState(0);
  const [detailReload, setDetailReload] = useState(0);

  useEffect(() => {
    if (!environment.selectedId) {
      setPolicies([]);
      setSelectedId("");
      return;
    }
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    fetchPolicyPage({ env_id: environment.selectedId, limit: 200, offset: 0 })
      .then((result) => {
        if (cancelled) return;
        setPolicies(result.data);
        setPolicyTotal(result.meta?.total ?? result.data.length);
        setSelectedId((current) =>
          current && result.data.some((item) => item.id === current)
            ? current
            : (result.data[0]?.id ?? ""),
        );
      })
      .catch((cause) => {
        if (!cancelled) setListError(cause);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [environment.selectedId, listReload]);

  useEffect(() => {
    if (!selectedId) {
      setPolicy(null);
      setVersions([]);
      setDraft(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    Promise.all([fetchPolicy(selectedId), fetchPolicyVersions(selectedId)])
      .then(([detail, history]) => {
        if (cancelled) return;
        setPolicy(detail.data);
        setVersions(history.data);
        setDraft(cloneDocument(detail.data.draft_document));
        setDraftReason("");
      })
      .catch((cause) => {
        if (!cancelled) setDetailError(cause);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailReload]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(policy?.draft_document ?? null),
    [draft, policy],
  );

  function reloadAll() {
    setListReload((value) => value + 1);
    setDetailReload((value) => value + 1);
  }

  function selectPolicy(id: string) {
    if (id === selectedId) return;
    if (dirty && !window.confirm("Discard the unsaved draft changes?")) return;
    setFeedback(null);
    setSelectedId(id);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const name = createName.trim();
    if (!name || !environment.selectedId) return;
    setMutation("create");
    setFeedback(null);
    try {
      const result = await createPolicy({ env_id: environment.selectedId, name });
      setCreateName("");
      setSelectedId(result.data.id);
      setFeedback({ tone: "success", message: `Created draft policy “${result.data.name}”.` });
      setListReload((value) => value + 1);
      setDetailReload((value) => value + 1);
    } catch (cause) {
      setFeedback({ tone: "danger", message: mutationMessage(cause) });
    } finally {
      setMutation("");
    }
  }

  async function handleSave() {
    if (!policy || !draft) return;
    const reason = draftReason.trim();
    if (!reason) {
      setFeedback({
        tone: "danger",
        message: "Enter an audit reason before saving this policy draft.",
      });
      return;
    }
    const validation = validateDocument(draft);
    if (validation) {
      setFeedback({ tone: "danger", message: validation });
      return;
    }
    setMutation("save");
    setFeedback(null);
    try {
      const result = await updatePolicyDraft(policy.id, draft, reason);
      setPolicy(result.data);
      setDraft(cloneDocument(result.data.draft_document));
      setDraftReason("");
      setFeedback({ tone: "success", message: "Draft saved. The active version was not changed." });
      setListReload((value) => value + 1);
    } catch (cause) {
      setFeedback({ tone: "danger", message: mutationMessage(cause) });
    } finally {
      setMutation("");
    }
  }

  async function handlePublish() {
    if (!policy || dirty) return;
    if (!window.confirm(`Publish the current draft for “${policy.name}”?`)) return;
    setMutation("publish");
    setFeedback(null);
    try {
      const result = await publishPolicy(policy.id);
      setFeedback({
        tone: "success",
        message: `Published version ${result.data.version}. It is now active for this environment.`,
      });
      reloadAll();
    } catch (cause) {
      setFeedback({ tone: "danger", message: mutationMessage(cause) });
    } finally {
      setMutation("");
    }
  }

  async function handleRollback(version: number) {
    if (!policy) return;
    if (
      dirty &&
      !window.confirm(
        "Rollback will discard the unsaved in-browser draft. Continue?",
      )
    ) {
      return;
    }
    if (
      !window.confirm(
        `Roll back to version ${version}? The backend will publish a new immutable version; history will not be rewritten.`,
      )
    ) {
      return;
    }
    setMutation(`rollback-${version}`);
    setFeedback(null);
    try {
      const result = await rollbackPolicy(policy.id, version);
      setFeedback({
        tone: "success",
        message: `Rollback published as new active version ${result.data.version}.`,
      });
      reloadAll();
    } catch (cause) {
      setFeedback({ tone: "danger", message: mutationMessage(cause) });
    } finally {
      setMutation("");
    }
  }

  if (environment.loading) {
    return <ScreenFrame><LoadingPanel label="Loading organizations and environments" /></ScreenFrame>;
  }
  if (environment.error) {
    return (
      <ScreenFrame>
        <ErrorPanel error={environment.error} onRetry={environment.reload} />
      </ScreenFrame>
    );
  }
  if (!environment.environments.length) {
    return (
      <ScreenFrame>
        <GlassPanel>
          <EmptyState
            title="No environments available"
            body="Create an organization environment before creating or managing a policy."
          />
        </GlassPanel>
      </ScreenFrame>
    );
  }

  return (
    <section data-screen-label="Risk Policy Management">
      <div className="mobile-wrap mb-[16px] flex items-center justify-between gap-[12px]">
        <div>
          <h1 className="page-title">Policies</h1>
          <div className="mt-[3px] text-[12px] text-[var(--muted-foreground)]">
            Draft, publish, compare, roll back, and simulate backend policy documents.
          </div>
        </div>
        <EnvironmentSelect
          className="mobile-full"
          environments={environment.environments}
          value={environment.selectedId}
          onChange={(value) => {
            if (dirty && !window.confirm("Discard the unsaved draft changes?")) return;
            environment.setSelectedId(value);
            setFeedback(null);
          }}
        />
      </div>

      {feedback ? <FeedbackBanner feedback={feedback} /> : null}

      <div className="responsive-stack grid grid-cols-[270px_minmax(0,1fr)] items-start gap-[16px]">
        <GlassPanel className="overflow-hidden">
          <div className="border-b border-[rgba(86,66,86,0.10)] p-[14px]">
            <div className="mb-[10px] flex items-center justify-between">
              <span className="text-[13px] font-bold">Policies</span>
              <span className="mono text-[11px] text-[var(--muted-foreground)]">{policyTotal}</span>
            </div>
            <form className="flex gap-[7px]" onSubmit={handleCreate}>
              <input
                aria-label="New policy name"
                className="control min-w-0 flex-1 font-normal"
                maxLength={200}
                placeholder="New policy name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
              />
              <ActionButton
                aria-label="Create policy"
                className="w-[36px] px-0"
                disabled={!createName.trim() || mutation === "create"}
                type="submit"
              >
                {mutation === "create" ? <span className="status-spinner" /> : <Plus size={14} />}
              </ActionButton>
            </form>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center gap-[8px] p-[30px] text-[12px] text-[var(--muted-foreground)]">
              <span className="status-spinner" /> Loading policies
            </div>
          ) : listError ? (
            <div className="p-[14px] text-[12px] text-[var(--danger-text)]">
              {errorMessage(listError)}
              <button
                className="button-reset ml-[6px] font-bold underline"
                type="button"
                onClick={() => setListReload((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          ) : policies.length ? (
            <div className="max-h-[540px] overflow-y-auto p-[7px]">
              {policies.map((item) => (
                <button
                  className="focus-ring mb-[3px] w-full rounded-[9px] border-0 p-[10px] text-left transition"
                  key={item.id}
                  style={{
                    background: item.id === selectedId ? "rgba(252,129,74,0.12)" : "transparent",
                    color: "var(--foreground)",
                  }}
                  type="button"
                  onClick={() => selectPolicy(item.id)}
                >
                  <div className="truncate text-[12.5px] font-bold">{item.name}</div>
                  <div className="mt-[4px] flex items-center justify-between gap-[6px]">
                    <span className="mono truncate text-[10.5px] text-[var(--muted-foreground)]">
                      {item.id}
                    </span>
                    <StatusBadge tone={item.active_version ? "success" : "neutral"}>
                      {item.active_version ? `v${item.active_version}` : "Draft only"}
                    </StatusBadge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No policies"
              body="Name a policy above to create its first normalized draft."
            />
          )}
        </GlassPanel>

        <div className="min-w-0">
          {!selectedId ? (
            <GlassPanel>
              <EmptyState
                title="Select or create a policy"
                body="Policy details, draft controls, history, and simulation appear here."
              />
            </GlassPanel>
          ) : detailLoading ? (
            <LoadingPanel label="Loading policy and version history" />
          ) : detailError ? (
            <ErrorPanel
              error={detailError}
              onRetry={() => setDetailReload((value) => value + 1)}
            />
          ) : policy && draft ? (
            <>
              <PolicyHeader
                dirty={dirty}
                mutation={mutation}
                policy={policy}
                reason={draftReason}
                onPublish={handlePublish}
                onReasonChange={setDraftReason}
                onSave={handleSave}
              />
              <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
              {tab === "draft" ? <DraftEditor document={draft} onChange={setDraft} /> : null}
              {tab === "lists" ? <ListsEditor document={draft} onChange={setDraft} /> : null}
              {tab === "simulator" ? (
                <Simulator draft={draft} policy={policy} versions={versions} />
              ) : null}
              {tab === "versions" ? (
                <VersionsTab
                  mutation={mutation}
                  versions={versions}
                  onRollback={handleRollback}
                />
              ) : null}
              {tab === "diff" ? (
                <DiffTab draft={draft} policy={policy} versions={versions} />
              ) : null}
            </>
          ) : (
            <ErrorPanel error={new Error("The policy did not include an editable draft document.")} />
          )}
        </div>
      </div>
    </section>
  );
}

function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <section data-screen-label="Risk Policy Management">
      <h1 className="page-title mb-[16px]">Policies</h1>
      {children}
    </section>
  );
}

function PolicyHeader({
  policy,
  dirty,
  mutation,
  reason,
  onSave,
  onReasonChange,
  onPublish,
}: {
  policy: Policy;
  dirty: boolean;
  mutation: string;
  reason: string;
  onSave: () => void;
  onReasonChange: (reason: string) => void;
  onPublish: () => void;
}) {
  return (
    <GlassPanel className="mb-[12px] p-[16px]">
      <div className="mobile-wrap flex items-center justify-between gap-[14px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[8px]">
            <h2 className="m-0 truncate text-[16px] font-extrabold">{policy.name}</h2>
            <StatusBadge tone={policy.active_version ? "success" : "neutral"}>
              {policy.active_version ? `Active v${policy.active_version}` : "Never published"}
            </StatusBadge>
            {dirty ? <StatusBadge tone="warning">Unsaved draft</StatusBadge> : null}
          </div>
          <div className="mono mt-[4px] text-[11px] text-[var(--muted-foreground)]">
            {policy.id} · created {formatTimestamp(policy.created_at_ms)}
          </div>
        </div>
        <div className="mobile-full flex shrink-0 gap-[8px]">
          <ActionButton
            className="mobile-full"
            disabled={!dirty || !reason.trim() || !!mutation}
            onClick={onSave}
            type="button"
          >
            {mutation === "save" ? <span className="status-spinner" /> : <Save size={13} />}
            <span className="ml-[6px]">Save draft</span>
          </ActionButton>
          <ActionButton
            className="mobile-full"
            disabled={dirty || !!mutation}
            onClick={onPublish}
            type="button"
            variant="primary"
          >
            {mutation === "publish" ? <span className="status-spinner" /> : "Publish"}
          </ActionButton>
        </div>
      </div>
      <label className="mt-[12px] block text-[12px] font-bold">
        Audit reason for this draft save
        <input
          aria-label="Policy draft audit reason"
          className="control mt-[4px] w-full font-normal"
          maxLength={2000}
          placeholder="Explain the policy or merchant-list change"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
        />
      </label>
    </GlassPanel>
  );
}

function DraftEditor({
  document,
  onChange,
}: {
  document: PolicyDocument;
  onChange: (document: PolicyDocument) => void;
}) {
  function patch<K extends keyof PolicyDocument>(field: K, value: PolicyDocument[K]) {
    onChange({ ...document, [field]: value });
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-[16px]">
      <GlassPanel className="p-[18px]">
        <div className="panel-title">Decision thresholds</div>
        <div className="grid grid-cols-2 gap-[12px] max-[640px]:grid-cols-1">
          <NumberField
            label="Review threshold"
            min={0.01}
            step="0.01"
            value={document.review_threshold}
            onChange={(value) => patch("review_threshold", value ?? 0)}
          />
          <NumberField
            label="Hard limit"
            min={0.01}
            step="0.01"
            value={document.hard_limit}
            onChange={(value) => patch("hard_limit", value ?? 0)}
          />
        </div>
        <p className="mb-0 mt-[10px] text-[11.5px] text-[var(--muted-foreground)]">
          Amounts above the review threshold need review; amounts above the hard limit are rejected.
        </p>
      </GlassPanel>

      <GlassPanel className="p-[18px]">
        <div className="panel-title">Budget and velocity</div>
        <div className="grid grid-cols-2 gap-[12px] max-[640px]:grid-cols-1">
          <NumberField
            label="Daily budget"
            nullable
            min={0.01}
            step="0.01"
            value={document.daily_budget}
            onChange={(value) => patch("daily_budget", value)}
          />
          <NumberField
            label="Monthly budget"
            nullable
            min={0.01}
            step="0.01"
            value={document.monthly_budget}
            onChange={(value) => patch("monthly_budget", value)}
          />
          <NumberField
            label="Warning ratio"
            min={0.01}
            max={1}
            step="0.01"
            value={document.budget_warning_ratio}
            onChange={(value) => patch("budget_warning_ratio", value ?? 0)}
          />
          <NumberField
            label="Max transactions / hour"
            nullable
            min={1}
            step="1"
            value={document.max_tx_per_hour}
            onChange={(value) => patch("max_tx_per_hour", value === null ? null : Math.trunc(value))}
          />
        </div>
      </GlassPanel>

      <GlassPanel className="p-[18px]">
        <div className="panel-title">Merchant treatment</div>
        <label className="block text-[12px] font-bold">
          Unknown merchants
          <select
            className="control mt-[4px] w-full"
            value={document.treat_unknown_merchant_as}
            onChange={(event) => patch("treat_unknown_merchant_as", event.target.value)}
          >
            <option value="needs_review">Needs review</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <CommaField
          label="Known merchants"
          value={document.known_merchants}
          onChange={(value) => patch("known_merchants", value)}
        />
      </GlassPanel>

      <GlassPanel className="p-[18px]">
        <div className="panel-title">Review and currency controls</div>
        <CommaField
          label="Review categories"
          placeholder="gift_cards, crypto"
          value={document.review_categories}
          onChange={(value) => patch("review_categories", value)}
        />
        <CommaField
          label="Allowed currencies"
          placeholder="USD, EUR"
          value={document.allowed_currencies}
          onChange={(value) => patch("allowed_currencies", value.map((item) => item.toUpperCase()))}
        />
      </GlassPanel>
    </div>
  );
}

function ListsEditor({
  document,
  onChange,
}: {
  document: PolicyDocument;
  onChange: (document: PolicyDocument) => void;
}) {
  return (
    <div>
      <CapabilityNotice title="Audited merchant-list changes" tone="success">
        Add, remove, enable, or disable entries below, then provide the required
        audit reason above before saving. The backend persists that reason on the
        <span className="mono"> policy.draft_update</span> audit entry.
      </CapabilityNotice>
      <div className="mt-[14px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[16px]">
        <PolicyListPanel
          allowlist
          entries={document.merchant_allowlist ?? []}
          enabled={document.merchant_allowlist !== null}
          text="When enabled, merchants not on this list are denied by the engine."
          title="Merchant allowlist"
          tone="success"
          onEnabled={(enabled) =>
            onChange({ ...document, merchant_allowlist: enabled ? [] : null })
          }
          onChange={(merchant_allowlist) => onChange({ ...document, merchant_allowlist })}
        />
        <PolicyListPanel
          entries={document.merchant_blocklist}
          text="Listed merchants are rejected by the engine."
          title="Merchant blocklist"
          tone="danger"
          onChange={(merchant_blocklist) => onChange({ ...document, merchant_blocklist })}
        />
      </div>
    </div>
  );
}

function PolicyListPanel({
  title,
  text,
  entries,
  tone,
  allowlist = false,
  enabled = true,
  onEnabled,
  onChange,
}: {
  title: string;
  text: string;
  entries: string[];
  tone: "success" | "danger";
  allowlist?: boolean;
  enabled?: boolean;
  onEnabled?: (enabled: boolean) => void;
  onChange: (entries: string[]) => void;
}) {
  const [value, setValue] = useState("");

  function add(event: FormEvent) {
    event.preventDefault();
    const next = value.trim();
    if (!next || entries.includes(next)) return;
    onChange([...entries, next]);
    setValue("");
  }

  return (
    <GlassPanel className="p-[18px]">
      <div className="mb-[8px] flex items-center justify-between gap-[8px]">
        <div className="panel-title m-0">{title}</div>
        {allowlist ? (
          <label className="flex items-center gap-[7px] text-[11.5px] font-bold">
            <input
              checked={enabled}
              type="checkbox"
              onChange={(event) => onEnabled?.(event.target.checked)}
            />
            Restrict
          </label>
        ) : null}
      </div>
      <div
        className="mb-[13px] rounded-[9px] p-[9px_11px] text-[11.5px]"
        style={{
          background: tone === "success" ? "rgba(74,138,104,0.10)" : "rgba(192,91,71,0.10)",
          color: tone === "success" ? "var(--success-text)" : "var(--danger-text)",
        }}
      >
        {allowlist && !enabled ? "Allowlist restriction is disabled (null)." : text}
      </div>
      <form className="mb-[13px] flex gap-[7px]" onSubmit={add}>
        <input
          aria-label={`Add to ${title}`}
          className="control min-w-0 flex-1 font-normal"
          disabled={!enabled}
          placeholder="Merchant name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <ActionButton disabled={!enabled || !value.trim()} type="submit">Add</ActionButton>
      </form>
      <div className="label-caps mb-[7px]">Draft entries ({entries.length})</div>
      {!enabled ? (
        <div className="py-[18px] text-center text-[12px] text-[var(--muted-foreground)]">
          Enable restriction to manage entries.
        </div>
      ) : entries.length ? (
        <div className="flex max-h-[300px] flex-col gap-[6px] overflow-y-auto">
          {entries.map((entry) => (
            <div
              className="mono flex items-center justify-between gap-[8px] rounded-[9px] border border-[var(--border)] bg-[var(--muted)] p-[7px_10px] text-[12px]"
              key={entry}
            >
              <span className="min-w-0 break-all">{entry}</span>
              <button
                aria-label={`Remove ${entry}`}
                className="button-reset shrink-0 font-bold text-[var(--danger-text)]"
                type="button"
                onClick={() => onChange(entries.filter((item) => item !== entry))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-[18px] text-center text-[12px] text-[var(--muted-foreground)]">
          No merchants in this draft list.
        </div>
      )}
    </GlassPanel>
  );
}

function Simulator({
  policy,
  versions,
  draft,
}: {
  policy: Policy;
  versions: PolicyVersion[];
  draft: PolicyDocument;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("USD");
  const [intent, setIntent] = useState("");
  const [source, setSource] = useState("draft");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSource("draft");
    setResult(null);
    setError("");
  }, [policy.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const version = source.startsWith("version:") ? Number(source.slice(8)) : undefined;
      const response = await simulatePolicy({
        payment: {
          merchant: merchant.trim(),
          amount: Number(amount),
          currency: currency.trim().toUpperCase() || "USD",
          intent_description: intent.trim(),
        },
        ...(source === "draft"
          ? { document: draft }
          : { policy_id: policy.id, version }),
      });
      setResult(response.data);
    } catch (cause) {
      setError(mutationMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[16px]">
      <GlassPanel className="p-[18px]">
        <div className="panel-title">
          <FlaskConical className="mr-[7px] inline" size={15} />
          Hypothetical payment
        </div>
        <form className="flex flex-col gap-[11px]" onSubmit={submit}>
          <TextField label="Merchant" required value={merchant} onChange={setMerchant} />
          <div className="grid grid-cols-2 gap-[10px]">
            <TextField label="Amount" required type="number" min="0.01" step="0.01" value={amount} onChange={setAmount} />
            <TextField label="Currency" required maxLength={3} value={currency} onChange={setCurrency} />
          </div>
          <TextField label="Intent description" value={intent} onChange={setIntent} />
          <label className="text-[12px] font-bold">
            Policy source
            <select className="control mt-[4px] w-full" value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="draft">Current in-browser draft</option>
              {versions.map((version) => (
                <option key={version.version} value={`version:${version.version}`}>
                  Version {version.version}{version.is_active ? " (active)" : ""}
                </option>
              ))}
            </select>
          </label>
          <ActionButton
            className="mt-[3px]"
            disabled={loading || !merchant.trim() || Number(amount) <= 0}
            type="submit"
            variant="aubergine"
          >
            {loading ? <span className="status-spinner" /> : "Simulate decision"}
          </ActionButton>
        </form>
      </GlassPanel>
      <GlassPanel variant="strong" className="p-[18px]">
        <div className="panel-title">Result</div>
        {error ? (
          <div className="rounded-[9px] bg-[rgba(192,91,71,0.10)] p-[11px] text-[12px] text-[var(--danger-text)]">
            {error}
          </div>
        ) : !result ? (
          <div className="py-[48px] text-center text-[12.5px] text-[var(--muted-foreground)]">
            Run a simulation. The backend evaluates it without persisting a payment or decision.
          </div>
        ) : (
          <div>
            <div className="mb-[13px] flex flex-wrap items-center gap-[8px]">
              <StatusBadge
                size="lg"
                tone={result.verdict === "approved" ? "success" : result.verdict === "rejected" ? "danger" : "warning"}
              >
                {result.verdict.replace("_", " ")}
              </StatusBadge>
              <StatusBadge tone="neutral">Not persisted</StatusBadge>
            </div>
            <ResultList label="Reasons" values={result.reasons} />
            <ResultList label="Risk flags" values={result.risk_flags} />
            <div className="label-caps mb-[5px] mt-[14px]">Policy source</div>
            <pre className="mono m-0 overflow-x-auto rounded-[8px] bg-[rgba(86,66,86,0.07)] p-[9px] text-[11.5px]">
              {JSON.stringify(result.policy_source, null, 2)}
            </pre>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function VersionsTab({
  versions,
  mutation,
  onRollback,
}: {
  versions: PolicyVersion[];
  mutation: string;
  onRollback: (version: number) => void;
}) {
  const columns = "90px 110px minmax(180px,1fr) 130px";
  return (
    <GlassPanel className="overflow-hidden">
      <div className="p-[14px_16px_6px]">
        <div className="panel-title mb-[4px]">
          <History className="mr-[7px] inline" size={15} />
          Immutable version history
        </div>
        <div className="text-[11.5px] text-[var(--muted-foreground)]">
          Rollback copies an older document into a newly published version.
        </div>
      </div>
      {versions.length ? (
        <GridTable columns={columns} headers={["Version", "Status", "Published", "Action"]} minWidth={560}>
          {[...versions].reverse().map((version) => (
            <GridRow columns={columns} key={version.version}>
              <GridCell className="mono font-bold">v{version.version}</GridCell>
              <GridCell>
                <StatusBadge tone={version.is_active ? "success" : "neutral"}>
                  {version.is_active ? "Active" : "Inactive"}
                </StatusBadge>
              </GridCell>
              <GridCell className="mono text-[11.5px]">{formatTimestamp(version.published_at_ms)}</GridCell>
              <GridCell>
                <ActionButton
                  className="h-[28px] text-[11.5px]"
                  disabled={version.is_active || !!mutation}
                  type="button"
                  onClick={() => onRollback(version.version)}
                >
                  {mutation === `rollback-${version.version}` ? <span className="status-spinner" /> : "Roll back"}
                </ActionButton>
              </GridCell>
            </GridRow>
          ))}
        </GridTable>
      ) : (
        <EmptyState title="No published versions" body="Save the draft, then publish it to create version 1." />
      )}
    </GlassPanel>
  );
}

function DiffTab({
  policy,
  versions,
  draft,
}: {
  policy: Policy;
  versions: PolicyVersion[];
  draft: PolicyDocument;
}) {
  const [base, setBase] = useState(versions.length ? String(versions[versions.length - 1].version) : "");
  const [target, setTarget] = useState("draft");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBase(versions.length ? String(versions[versions.length - 1].version) : "");
    setTarget("draft");
    setResult(null);
    setError("");
  }, [policy.id, versions]);

  async function compare() {
    if (!base || !target) return;
    setLoading(true);
    setError("");
    try {
      if (base === "draft" || target === "draft") {
        const baseDocument =
          base === "draft"
            ? draft
            : versions.find((version) => version.version === Number(base))?.document;
        const targetDocument =
          target === "draft"
            ? draft
            : versions.find((version) => version.version === Number(target))?.document;
        if (!baseDocument || !targetDocument) {
          throw new Error("One of the selected policy references is unavailable.");
        }
        setResult({
          policy_id: policy.id,
          base: base === "draft" ? "draft" : Number(base),
          target: target === "draft" ? "draft" : Number(target),
          changes: diffPolicyDocuments(baseDocument, targetDocument),
        });
      } else {
        const response = await comparePolicyVersions(policy.id, base, target);
        setResult(response.data);
      }
    } catch (cause) {
      setResult(null);
      setError(mutationMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  const refs = [
    { label: "Current draft", value: "draft" },
    ...[...versions].reverse().map((version) => ({
      label: `Version ${version.version}${version.is_active ? " (active)" : ""}`,
      value: String(version.version),
    })),
  ];

  return (
    <GlassPanel className="p-[18px]">
      <div className="panel-title">
        <FileDiff className="mr-[7px] inline" size={15} />
        Field-level policy diff
      </div>
      {!versions.length ? (
        <EmptyState title="Nothing to compare yet" body="Publish at least one version before comparing it with another version or the draft." />
      ) : (
        <>
          <div className="mobile-wrap mb-[14px] flex items-end gap-[10px]">
            <DiffSelect label="Base" options={refs} value={base} onChange={setBase} />
            <DiffSelect label="Target" options={refs} value={target} onChange={setTarget} />
            <ActionButton className="mobile-full" disabled={loading || base === target} onClick={compare} type="button">
              {loading ? <span className="status-spinner" /> : "Compare"}
            </ActionButton>
          </div>
          {error ? (
            <div className="rounded-[9px] bg-[rgba(192,91,71,0.10)] p-[11px] text-[12px] text-[var(--danger-text)]">{error}</div>
          ) : result ? (
            <div>
              <div className="mb-[8px] text-[12px] text-[var(--muted-foreground)]">
                {Object.keys(result.changes).length} changed field{Object.keys(result.changes).length === 1 ? "" : "s"}
              </div>
              {Object.keys(result.changes).length ? (
                <div className="flex flex-col gap-[8px]">
                  {Object.entries(result.changes).map(([field, change]) => (
                    <div className="rounded-[10px] border border-[rgba(86,66,86,0.10)] p-[11px]" key={field}>
                      <div className="mono mb-[7px] text-[12px] font-bold">{field}</div>
                      <div className="grid grid-cols-2 gap-[8px] max-[640px]:grid-cols-1">
                        <DiffValue label={`Base · ${result.base}`} tone="danger" value={change.base} />
                        <DiffValue label={`Target · ${result.target}`} tone="success" value={change.target} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[9px] bg-[rgba(74,138,104,0.10)] p-[14px] text-[12px] text-[var(--success-text)]">
                  These references have identical policy documents.
                </div>
              )}
            </div>
          ) : (
            <div className="py-[36px] text-center text-[12px] text-[var(--muted-foreground)]">
              Choose two different references and compare them.
            </div>
          )}
        </>
      )}
    </GlassPanel>
  );
}

function DiffSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mobile-full min-w-[180px] flex-1 text-[12px] font-bold">
      {label}
      <select className="control mt-[4px] w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function DiffValue({ label, value, tone }: { label: string; value: unknown; tone: "success" | "danger" }) {
  return (
    <div
      className="min-w-0 rounded-[8px] p-[8px]"
      style={{
        background: tone === "success" ? "rgba(74,138,104,0.09)" : "rgba(192,91,71,0.09)",
        color: tone === "success" ? "var(--success-text)" : "var(--danger-text)",
      }}
    >
      <div className="label-caps mb-[4px]">{label}</div>
      <div className="mono break-all text-[11.5px]">{formatJsonValue(value)}</div>
    </div>
  );
}

function FeedbackBanner({ feedback }: { feedback: Exclude<Feedback, null> }) {
  const styles = {
    success: { background: "rgba(74,138,104,0.12)", color: "var(--success-text)", border: "rgba(74,138,104,0.22)" },
    danger: { background: "rgba(192,91,71,0.12)", color: "var(--danger-text)", border: "rgba(192,91,71,0.22)" },
    warning: { background: "rgba(217,151,59,0.12)", color: "var(--warning-text)", border: "rgba(217,151,59,0.22)" },
  }[feedback.tone];
  return (
    <div className="mb-[14px] rounded-[10px] border p-[10px_12px] text-[12.5px] font-semibold" style={{ background: styles.background, color: styles.color, borderColor: styles.border }}>
      {feedback.message}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  nullable = false,
  ...input
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  nullable?: boolean;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <label className="text-[12px] font-bold">
      {label}
      <input
        className="control mt-[4px] w-full font-normal"
        type="number"
        value={value ?? ""}
        placeholder={nullable ? "No limit" : undefined}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        {...input}
      />
    </label>
  );
}

function CommaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-[11px] block text-[12px] font-bold">
      {label}
      <input
        className="control mt-[4px] w-full font-normal"
        defaultValue={value.join(", ")}
        key={value.join("\u0000")}
        placeholder={placeholder}
        onBlur={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
      />
      <span className="mt-[3px] block text-[10.5px] font-normal text-[var(--muted-foreground)]">Comma-separated values</span>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  ...input
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
  maxLength?: number;
}) {
  return (
    <label className="text-[12px] font-bold">
      {label}
      <input className="control mt-[4px] w-full font-normal" value={value} onChange={(event) => onChange(event.target.value)} {...input} />
    </label>
  );
}

function ResultList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-[12px]">
      <div className="label-caps mb-[5px]">{label}</div>
      {values.length ? (
        <ul className="m-0 space-y-[4px] pl-[18px] text-[12.5px]">
          {values.map((value) => <li key={value}>{value}</li>)}
        </ul>
      ) : (
        <div className="text-[12px] text-[var(--muted-foreground)]">None</div>
      )}
    </div>
  );
}

function cloneDocument(document: PolicyDocument | null): PolicyDocument | null {
  return document ? JSON.parse(JSON.stringify(document)) as PolicyDocument : null;
}

function diffPolicyDocuments(
  base: PolicyDocument,
  target: PolicyDocument,
): Record<string, { base: unknown; target: unknown }> {
  const changes: Record<string, { base: unknown; target: unknown }> = {};
  for (const key of Object.keys({ ...base, ...target }) as Array<keyof PolicyDocument>) {
    if (JSON.stringify(base[key]) !== JSON.stringify(target[key])) {
      changes[key] = { base: base[key], target: target[key] };
    }
  }
  return changes;
}

function validateDocument(document: PolicyDocument): string | null {
  if (!(document.review_threshold > 0)) return "Review threshold must be greater than zero.";
  if (!(document.hard_limit > 0)) return "Hard limit must be greater than zero.";
  if (document.hard_limit < document.review_threshold) {
    return "Hard limit must be greater than or equal to the review threshold.";
  }
  if (!(document.budget_warning_ratio > 0 && document.budget_warning_ratio <= 1)) {
    return "Budget warning ratio must be greater than zero and no more than 1.";
  }
  if (document.daily_budget !== null && !(document.daily_budget > 0)) {
    return "Daily budget must be blank or greater than zero.";
  }
  if (document.monthly_budget !== null && !(document.monthly_budget > 0)) {
    return "Monthly budget must be blank or greater than zero.";
  }
  if (
    document.max_tx_per_hour !== null &&
    (!Number.isInteger(document.max_tx_per_hour) || document.max_tx_per_hour < 1)
  ) {
    return "Maximum transactions per hour must be blank or a whole number of at least 1.";
  }
  return null;
}

function mutationMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "Permission denied. This action requires an admin API key.";
  }
  return errorMessage(error);
}
