import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, Server, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { useSession } from "../../context/DashboardContext";

interface LoginLocationState {
  from?: string;
}

export function LoginScreen() {
  const { enterDemo, notice, signIn } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [endpoint, setEndpoint] = useState("http://127.0.0.1:8800");
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destination = (location.state as LoginLocationState | null)?.from ?? "/";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(endpoint, apiKey);
      navigate(destination, { replace: true });
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(
          cause.status === 403
            ? "This API key does not have dashboard read access."
            : cause.message,
        );
      } else {
        setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-background flex min-h-screen items-center justify-center p-[24px] text-[var(--foreground)]">
      <div className="grid w-full max-w-[900px] grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] overflow-hidden rounded-[24px] border border-[var(--glass-border-strong)] bg-[var(--glass-panel)] shadow-[var(--shadow-elevated)] backdrop-blur-[22px] max-[760px]:grid-cols-1">
        <section className="flex flex-col justify-between bg-[linear-gradient(145deg,var(--primary),var(--primary-dark))] p-[42px] text-white max-[760px]:hidden">
          <div>
            <div className="mb-[22px] flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[var(--accent)] shadow-[var(--shadow-accent-button)]">
              <ShieldCheck size={25} />
            </div>
            <h1 className="m-0 max-w-[350px] text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em]">
              Every agent payment, explained.
            </h1>
            <p className="mt-[16px] max-w-[390px] text-[14px] leading-[1.6] text-white/70">
              Monitor decisions, inspect traces, and operate payment controls from one audit-ready workspace.
            </p>
          </div>
          <div className="mono text-[11px] uppercase tracking-[0.1em] text-white/45">
            Paiziq control plane
          </div>
        </section>

        <section className="p-[42px] max-[520px]:p-[28px_22px]">
          <div className="mb-[26px]">
            <div className="mb-[12px] flex h-[42px] w-[42px] items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,var(--accent),var(--accent-dark))] text-white min-[761px]:hidden">
              <ShieldCheck size={21} />
            </div>
            <h2 className="m-0 text-[23px] font-extrabold tracking-[-0.02em]">Sign in to Paiziq</h2>
            <p className="mb-0 mt-[7px] text-[13px] text-[var(--muted-foreground)]">
              Connect with a backend URL and a read-capable API key.
            </p>
          </div>

          <form onSubmit={submit}>
            <label className="mb-[6px] block text-[12px] font-bold" htmlFor="login-endpoint">
              Backend URL
            </label>
            <div className="relative mb-[16px]">
              <Server className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
              <input
                autoCapitalize="none"
                autoCorrect="off"
                className="control h-[42px] w-full pl-[38px] font-normal"
                id="login-endpoint"
                inputMode="url"
                required
                spellCheck={false}
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
              />
            </div>

            <label className="mb-[6px] block text-[12px] font-bold" htmlFor="login-api-key">
              API key
            </label>
            <div className="relative mb-[18px]">
              <KeyRound className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
              <input
                autoComplete="current-password"
                className="control mono h-[42px] w-full pl-[38px] font-normal"
                id="login-api-key"
                placeholder="pzq_..."
                required
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </div>

            {error || notice ? (
              <div role="alert" className="mb-[14px] rounded-[9px] border border-[rgba(192,91,71,0.25)] bg-[rgba(192,91,71,0.10)] p-[10px_12px] text-[12.5px] font-semibold text-[var(--danger-text)]">
                {error ?? notice}
              </div>
            ) : null}

            <button
              className="focus-ring flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[10px] border-0 bg-[var(--primary)] text-[13px] font-bold text-white transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? <span className="status-spinner" /> : null}
              {submitting ? "Verifying access..." : "Connect dashboard"}
              {!submitting ? <ArrowRight size={16} /> : null}
            </button>
          </form>

          <div className="my-[20px] flex items-center gap-[10px] text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            or
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <button
            className="focus-ring h-[38px] w-full rounded-[9px] border border-[var(--border)] bg-[var(--input-background)] text-[12.5px] font-bold text-[var(--text-secondary)]"
            type="button"
            onClick={() => {
              enterDemo();
              navigate("/", { replace: true });
            }}
          >
            Explore interface without live data
          </button>
          <p className="mb-0 mt-[12px] text-center text-[11px] text-[var(--muted-foreground)]">
            Credentials stay in this tab&apos;s session storage and clear when the tab closes.
          </p>
        </section>
      </div>
    </main>
  );
}
