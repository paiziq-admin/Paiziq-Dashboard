import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Check, Copy, KeyRound, RotateCcw, ShieldBan } from "lucide-react";
import { ApiError } from "../../../api/client";
import { fetchApiKeyPage } from "../../../api/admin";
import { createApiKey, revokeApiKey, rotateApiKey } from "../../../api/resources";
import type { ApiKey } from "../../../api/types";
import {
  ActionButton,
  EmptyState,
  GlassPanel,
  GridCell,
  GridRow,
  GridTable,
  StatusBadge,
} from "../../primitives";
import {
  CapabilityNotice,
  EnvironmentSelect,
  ErrorPanel,
  LoadingPanel,
  RefreshButton,
  errorMessage,
  formatTimestamp,
  useAdminEnvironments,
} from "../admin/AdminSupport";

type Scope = ApiKey["scope"];
type Role = NonNullable<ApiKey["role"]>;

type SecretReveal = {
  key: ApiKey;
  secret: string;
  operation: "created" | "rotated";
};

const columns = "minmax(180px,1.3fr) 105px 110px 130px 145px minmax(210px,1.5fr)";

export function SettingsScreen() {
  const environment = useAdminEnvironments();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [feedback, setFeedback] = useState("");
  const [mutation, setMutation] = useState("");
  const [reload, setReload] = useState(0);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<Scope>("read");
  const [role, setRole] = useState<Role>("read_only");
  const [graceSeconds, setGraceSeconds] = useState(0);
  const [secretReveal, setSecretReveal] = useState<SecretReveal | null>(null);

  useEffect(() => {
    if (!environment.selectedId) {
      setKeys([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchApiKeyPage({ env_id: environment.selectedId, limit: 200, offset: 0 })
      .then((result) => {
        if (cancelled) return;
        setKeys(result.data.map(withoutSecret));
        setTotal(result.meta?.total ?? result.data.length);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [environment.selectedId, reload]);

  function updateScope(value: Scope) {
    setScope(value);
    setRole(value === "admin" ? "admin" : value === "ingest" ? "developer" : "read_only");
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !environment.selectedId) return;
    setMutation("create");
    setFeedback("");
    try {
      const result = await createApiKey({
        env_id: environment.selectedId,
        name: trimmedName,
        scope,
        role,
      });
      const secret = result.data.secret;
      if (!secret) throw new Error("The backend created the key but did not return its one-time secret.");
      setName("");
      setSecretReveal({ key: withoutSecret(result.data), secret, operation: "created" });
      setReload((value) => value + 1);
    } catch (cause) {
      setFeedback(actionMessage(cause));
    } finally {
      setMutation("");
    }
  }

  async function handleRotate(key: ApiKey) {
    const graceText = graceSeconds
      ? `The old secret will remain valid for ${formatGrace(graceSeconds)}.`
      : "The old secret will stop validating immediately.";
    if (!window.confirm(`Rotate “${key.name}”? ${graceText}`)) return;
    setMutation(`rotate-${key.id}`);
    setFeedback("");
    try {
      const result = await rotateApiKey(key.id, graceSeconds);
      const secret = result.data.secret;
      if (!secret) throw new Error("The backend rotated the key but did not return its one-time secret.");
      setSecretReveal({ key: withoutSecret(result.data), secret, operation: "rotated" });
      setReload((value) => value + 1);
    } catch (cause) {
      setFeedback(actionMessage(cause));
    } finally {
      setMutation("");
    }
  }

  async function handleRevoke(key: ApiKey) {
    if (!window.confirm(`Revoke “${key.name}”? This key will stop validating immediately.`)) return;
    setMutation(`revoke-${key.id}`);
    setFeedback("");
    try {
      const result = await revokeApiKey(key.id);
      setKeys((items) => items.map((item) => (item.id === key.id ? withoutSecret(result.data) : item)));
    } catch (cause) {
      setFeedback(actionMessage(cause));
    } finally {
      setMutation("");
    }
  }

  if (environment.loading) {
    return <ScreenFrame><LoadingPanel label="Loading environments" /></ScreenFrame>;
  }
  if (environment.error) {
    return <ScreenFrame><ErrorPanel error={environment.error} onRetry={environment.reload} /></ScreenFrame>;
  }
  if (!environment.environments.length) {
    return (
      <ScreenFrame>
        <GlassPanel>
          <EmptyState title="No environments available" body="API keys must belong to an environment." icon={<KeyRound size={22} />} />
        </GlassPanel>
      </ScreenFrame>
    );
  }

  return (
    <section data-screen-label="Settings">
      <div className="mobile-wrap mb-[16px] flex items-center justify-between gap-[12px]">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="mt-[3px] text-[12px] text-[var(--muted-foreground)]">
            Create, rotate, and revoke environment API keys.
          </div>
        </div>
        <EnvironmentSelect
          className="mobile-full"
          environments={environment.environments}
          value={environment.selectedId}
          onChange={environment.setSelectedId}
        />
      </div>

      {error ? (
        <ErrorPanel error={error} onRetry={() => setReload((value) => value + 1)} />
      ) : (
        <div className="flex flex-col gap-[16px]">
          {feedback ? (
            <div className="rounded-[10px] border border-[rgba(192,91,71,0.22)] bg-[rgba(192,91,71,0.10)] p-[10px_12px] text-[12.5px] text-[var(--danger-text)]">
              {feedback}
            </div>
          ) : null}

          <GlassPanel className="p-[18px]">
            <div className="panel-title mb-[4px]">Create API key</div>
            <div className="mb-[14px] text-[12px] text-[var(--muted-foreground)]">
              The server generates the secret. It is shown once after creation and is never returned by list requests.
            </div>
            <form className="grid grid-cols-[minmax(170px,1fr)_150px_150px_auto] items-end gap-[10px] max-[800px]:grid-cols-2 max-[520px]:grid-cols-1" onSubmit={handleCreate}>
              <Field label="Key name">
                <input
                  className="control mt-[4px] w-full font-normal"
                  maxLength={200}
                  placeholder="CI deployment"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field label="Scope">
                <select className="control mt-[4px] w-full" value={scope} onChange={(event) => updateScope(event.target.value as Scope)}>
                  <option value="ingest">ingest</option>
                  <option value="read">read</option>
                  <option value="admin">admin</option>
                </select>
              </Field>
              <Field label="Role">
                <select className="control mt-[4px] w-full" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  <option value="admin">admin</option>
                  <option value="developer">developer</option>
                  <option value="reviewer">reviewer</option>
                  <option value="read_only">read_only</option>
                </select>
              </Field>
              <ActionButton disabled={!name.trim() || mutation === "create"} type="submit" variant="primary">
                {mutation === "create" ? <span className="status-spinner" /> : <><KeyRound className="mr-[6px]" size={13} />Create key</>}
              </ActionButton>
            </form>
          </GlassPanel>

          <GlassPanel className="overflow-hidden">
            <div className="mobile-wrap flex items-center justify-between gap-[10px] border-b border-[rgba(86,66,86,0.10)] p-[14px_16px]">
              <div>
                <div className="text-[13px] font-bold">API keys</div>
                <div className="text-[11.5px] text-[var(--muted-foreground)]">{total} key records, including revoked keys</div>
              </div>
              <div className="mobile-wrap flex items-center gap-[8px]">
                <label className="text-[11.5px] font-bold text-[var(--muted-foreground)]">
                  Rotation grace
                  <select className="control-sm ml-[7px]" value={graceSeconds} onChange={(event) => setGraceSeconds(Number(event.target.value))}>
                    <option value={0}>Immediate</option>
                    <option value={3600}>1 hour</option>
                    <option value={86400}>24 hours</option>
                    <option value={604800}>7 days</option>
                  </select>
                </label>
                <RefreshButton busy={loading} onClick={() => setReload((value) => value + 1)} />
              </div>
            </div>
            {loading ? (
              <div className="flex min-h-[190px] items-center justify-center gap-[8px] text-[12.5px] text-[var(--muted-foreground)]">
                <span className="status-spinner" /> Loading API keys
              </div>
            ) : keys.length ? (
              <GridTable columns={columns} headers={["Key", "Scope", "Role", "Status", "Secret prefix", "Actions"]} minWidth={920}>
                {[...keys].reverse().map((key) => (
                  <GridRow columns={columns} key={key.id}>
                    <GridCell>
                      <div className="truncate font-bold">{key.name}</div>
                      <div className="mono truncate text-[10.5px] text-[var(--muted-foreground)]">{key.id}</div>
                    </GridCell>
                    <GridCell><StatusBadge>{key.scope}</StatusBadge></GridCell>
                    <GridCell>{key.role ?? "—"}</GridCell>
                    <GridCell>
                      <StatusBadge tone={key.revoked_at_ms ? "danger" : key.grace_until_ms ? "warning" : "success"}>
                        {key.revoked_at_ms ? "Revoked" : key.grace_until_ms ? "Grace window" : "Active"}
                      </StatusBadge>
                    </GridCell>
                    <GridCell>
                      <div className="mono text-[12px]">{key.secret_prefix}••••••••</div>
                      <div className="mt-[2px] text-[10.5px] text-[var(--muted-foreground)]">
                        {key.rotated_at_ms ? `Rotated ${formatTimestamp(key.rotated_at_ms)}` : `Created ${formatTimestamp(key.created_at_ms)}`}
                      </div>
                    </GridCell>
                    <GridCell>
                      <div className="flex flex-wrap gap-[6px]">
                        <ActionButton
                          className="h-[28px] text-[11.5px]"
                          disabled={!!key.revoked_at_ms || !!mutation}
                          onClick={() => void handleRotate(key)}
                          type="button"
                        >
                          {mutation === `rotate-${key.id}` ? <span className="status-spinner" /> : <><RotateCcw className="mr-[5px]" size={12} />Rotate</>}
                        </ActionButton>
                        <ActionButton
                          className="h-[28px] text-[11.5px] text-[var(--danger-text)]"
                          disabled={!!key.revoked_at_ms || !!mutation}
                          onClick={() => void handleRevoke(key)}
                          type="button"
                        >
                          {mutation === `revoke-${key.id}` ? <span className="status-spinner" /> : <><ShieldBan className="mr-[5px]" size={12} />Revoke</>}
                        </ActionButton>
                      </div>
                    </GridCell>
                  </GridRow>
                ))}
              </GridTable>
            ) : (
              <EmptyState title="No API keys" body="Create the first key for this environment above." icon={<KeyRound size={22} />} />
            )}
          </GlassPanel>

          <CapabilityNotice title="Other settings are not writable">
            The current backend contract does not expose organization-name, timezone, or notification-preference update endpoints, so this screen does not save local-only settings that would imply a backend change.
          </CapabilityNotice>
        </div>
      )}

      <SecretDialog value={secretReveal} onClose={() => setSecretReveal(null)} />
    </section>
  );
}

function SecretDialog({ value, onClose }: { value: SecretReveal | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const copiedRef = useRef(copied);
  closeRef.current = onClose;
  copiedRef.current = copied;

  useEffect(() => {
    setCopied(false);
    setCopyError("");
  }, [value]);

  useEffect(() => {
    if (!value) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const frame = window.requestAnimationFrame(() => {
      const first = modalFocusableElements(dialog)[0];
      (first ?? dialog)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (
          copiedRef.current ||
          window.confirm("Close this one-time secret without confirming that it was saved?")
        ) {
          closeRef.current();
        }
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = modalFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [Boolean(value)]);

  if (!value) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value!.secret);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError("Clipboard access was denied. Select and copy the secret manually.");
    }
  }

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-40 bg-[rgba(58,47,60,0.38)] backdrop-blur-[3px]" />
      <div
        ref={dialogRef}
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[calc(100vw-28px)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-[var(--glass-border-strong)] bg-[var(--popover)] p-[22px] text-[var(--popover-foreground)] shadow-[var(--shadow-elevated)] backdrop-blur-[28px]"
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="mb-[6px] flex items-center gap-[9px]">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[rgba(252,129,74,0.13)] text-[var(--accent-dark)]"><KeyRound size={17} /></span>
          <h2 className="m-0 text-[16px] font-extrabold" id={titleId}>
            API key {value.operation}
          </h2>
        </div>
        <p className="mb-[14px] mt-[6px] text-[12.5px] text-[var(--text-secondary)]">
          Copy the secret for <strong>{value.key.name}</strong> now. Paiziq returns the plaintext exactly once; closing this dialog permanently removes it from the dashboard.
        </p>
        <div className="flex items-center gap-[8px] rounded-[10px] bg-[var(--code-bg)] p-[10px]">
          <input
            aria-label="One-time API secret"
            className="mono min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[var(--code-text)] outline-none"
            readOnly
            value={value.secret}
            onFocus={(event) => event.target.select()}
          />
          <ActionButton className="shrink-0" onClick={() => void copy()} type="button">
            {copied ? <Check className="mr-[5px]" size={13} /> : <Copy className="mr-[5px]" size={13} />}
            {copied ? "Copied" : "Copy"}
          </ActionButton>
        </div>
        {copyError ? <div className="mt-[8px] text-[11.5px] text-[var(--danger-text)]" role="alert">{copyError}</div> : null}
        {value.key.grace_until_ms ? (
          <div className="mt-[10px] rounded-[9px] bg-[rgba(217,151,59,0.12)] p-[9px_11px] text-[11.5px] text-[var(--warning-text)]">
            The previous secret remains valid until {formatTimestamp(value.key.grace_until_ms)}.
          </div>
        ) : null}
        <div className="mt-[16px] flex justify-end">
          <ActionButton onClick={onClose} type="button" variant="aubergine">I saved this secret</ActionButton>
        </div>
      </div>
    </>
  );
}

function modalFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}

function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <section data-screen-label="Settings">
      <h1 className="page-title mb-[16px]">Settings</h1>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="text-[12px] font-bold">{label}{children}</label>;
}

function withoutSecret(key: ApiKey): ApiKey {
  const record = { ...key };
  delete record.secret;
  return record;
}

function actionMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "Permission denied. API-key lifecycle actions require an admin key.";
  }
  return errorMessage(error);
}

function formatGrace(seconds: number): string {
  if (seconds === 604800) return "7 days";
  if (seconds === 86400) return "24 hours";
  if (seconds === 3600) return "1 hour";
  return `${seconds} seconds`;
}
