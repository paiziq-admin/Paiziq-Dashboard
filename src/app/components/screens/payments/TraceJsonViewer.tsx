import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, EyeOff, Search } from "lucide-react";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY =
  /(^|[_.-])(authorization|api[_-]?key|token|secret|password|passcode|card[_-]?number|account[_-]?number|routing[_-]?number|ssn)($|[_.-])/i;
const SECRET_VALUE = /^(bearer\s+|pzq_|whsec_|eyJ[\w-]+\.[\w-]+\.)/i;
const PII_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "email", pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { label: "card", pattern: /\b(?:\d[ -]?){13,19}\b/g },
  { label: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
];

export function TraceJsonViewer({ value }: { value: unknown }) {
  const { value: safeValue, redactions } = useMemo(() => redact(value), [value]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [treeRevision, setTreeRevision] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const formatted = useMemo(() => JSON.stringify(safeValue, null, 2) ?? "null", [safeValue]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const toggleAll = () => {
    setExpanded((current) => !current);
    setTreeRevision((current) => current + 1);
  };
  const copy = async () => {
    try {
      await copyText(formatted);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="overflow-hidden rounded-[11px] border border-[var(--border)] bg-[var(--code-bg)] text-[var(--code-text)]">
      <div className="flex flex-wrap items-center gap-[8px] border-b border-white/10 p-[10px]">
        <label className="relative min-w-[180px] flex-1">
          <span className="sr-only">Search trace JSON</span>
          <Search className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-white/45" size={14} />
          <input
            className="mono h-[31px] w-full rounded-[7px] border border-white/10 bg-black/20 pl-[30px] pr-[9px] text-[11.5px] text-white outline-none placeholder:text-white/35 focus:border-[var(--accent)]"
            placeholder="Search keys and values..."
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button
          className="focus-ring inline-flex h-[31px] items-center gap-[6px] rounded-[7px] border border-white/10 bg-white/5 px-[9px] text-[11.5px] font-semibold text-white/80 hover:bg-white/10"
          type="button"
          onClick={toggleAll}
        >
          {expanded ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Collapse" : "Expand"}
        </button>
        <button
          className="focus-ring inline-flex h-[31px] items-center gap-[6px] rounded-[7px] border border-white/10 bg-white/5 px-[9px] text-[11.5px] font-semibold text-white/80 hover:bg-white/10"
          type="button"
          onClick={copy}
        >
          {copyState === "copied" ? <Check size={13} /> : <Copy size={13} />}
          {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy redacted JSON"}
        </button>
        {redactions ? (
          <span className="inline-flex h-[29px] items-center gap-[5px] rounded-[999px] bg-[rgba(192,91,71,0.18)] px-[9px] text-[10.5px] font-bold text-[#ffb4a6]">
            <EyeOff size={12} /> {redactions} redacted
          </span>
        ) : null}
      </div>

      <div className="mono max-h-[520px] overflow-auto p-[14px] text-[11.5px] leading-[1.55]">
        <JsonNode
          key={treeRevision}
          initiallyOpen={expanded}
          query={query.trim().toLowerCase()}
          value={safeValue}
        />
        {query && !(JSON.stringify(safeValue) ?? "").toLowerCase().includes(query.trim().toLowerCase()) ? (
          <div className="p-[20px] text-center text-white/45">No trace fields match “{query}”.</div>
        ) : null}
      </div>
    </div>
  );
}

function JsonNode({
  value,
  name,
  query,
  initiallyOpen,
}: {
  value: unknown;
  name?: string;
  query: string;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === "object";
  const matches = !query || `${name ?? ""} ${JSON.stringify(value)}`.toLowerCase().includes(query);
  if (!matches) return null;

  if (!isObject) {
    return (
      <div className="flex min-w-max gap-[6px]">
        {name !== undefined ? (
          <span className="text-[#f2b99d]"><Highlight query={query} text={JSON.stringify(name)} />:</span>
        ) : null}
        {isRedacted(value) ? (
          <span className="rounded-[4px] bg-[rgba(192,91,71,0.22)] px-[5px] font-bold text-[#ffb4a6]">{String(value)}</span>
        ) : (
          <Primitive query={query} value={value} />
        )}
      </div>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const shownOpen = query ? true : open;
  const opening = isArray ? "[" : "{";
  const closing = isArray ? "]" : "}";
  return (
    <div className="min-w-max">
      <div className="flex items-center gap-[3px]">
        <button
          aria-label={`${shownOpen ? "Collapse" : "Expand"} ${name ?? "JSON node"}`}
          className="button-reset inline-flex h-[18px] w-[18px] items-center justify-center text-white/45 hover:text-white"
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          {shownOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {name !== undefined ? (
          <span className="text-[#f2b99d]"><Highlight query={query} text={JSON.stringify(name)} />:</span>
        ) : null}
        <span className="text-white/75">{opening}</span>
        {!shownOpen ? <span className="text-white/40"> {entries.length} items {closing}</span> : null}
      </div>
      {shownOpen ? (
        <>
          <div className="ml-[18px] border-l border-white/10 pl-[12px]">
            {entries.map(([key, child]) => (
              <JsonNode
                key={key}
                initiallyOpen={initiallyOpen}
                name={isArray ? key : key}
                query={query}
                value={child}
              />
            ))}
          </div>
          <div className="pl-[18px] text-white/75">{closing}</div>
        </>
      ) : null}
    </div>
  );
}

function Primitive({ value, query }: { value: unknown; query: string }) {
  const text = JSON.stringify(value);
  const color =
    typeof value === "string"
      ? "text-[#a9d6b9]"
      : typeof value === "number"
        ? "text-[#efc879]"
        : typeof value === "boolean"
          ? "text-[#bea8e8]"
          : "text-white/45";
  return <span className={color}><Highlight query={query} text={text} /></span>;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: Array<{ value: string; hit: boolean }> = [];
  let cursor = 0;
  let index = lower.indexOf(query, cursor);
  while (index >= 0) {
    if (index > cursor) parts.push({ value: text.slice(cursor, index), hit: false });
    parts.push({ value: text.slice(index, index + query.length), hit: true });
    cursor = index + query.length;
    index = lower.indexOf(query, cursor);
  }
  if (cursor < text.length) parts.push({ value: text.slice(cursor), hit: false });
  return (
    <>
      {parts.map((part, index) =>
        part.hit
          ? <mark className="rounded-[2px] bg-[var(--accent)] px-[1px] text-black" key={index}>{part.value}</mark>
          : <span key={index}>{part.value}</span>,
      )}
    </>
  );
}

function redact(value: unknown): { value: unknown; redactions: number } {
  let redactions = 0;
  const visit = (item: unknown, key?: string): unknown => {
    if (key && SENSITIVE_KEY.test(key)) {
      redactions += 1;
      return REDACTED;
    }
    if (typeof item === "string" && isRedacted(item)) {
      redactions += 1;
      return item;
    }
    if (typeof item === "string" && SECRET_VALUE.test(item)) {
      redactions += 1;
      return REDACTED;
    }
    if (typeof item === "string") {
      let scrubbed = item;
      PII_PATTERNS.forEach(({ label, pattern }) => {
        pattern.lastIndex = 0;
        scrubbed = scrubbed.replace(pattern, () => {
          redactions += 1;
          return `[REDACTED:${label}]`;
        });
      });
      return scrubbed;
    }
    if (Array.isArray(item)) return item.map((child) => visit(child));
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([childKey, child]) => [
          childKey,
          visit(child, childKey),
        ]),
      );
    }
    return item;
  };
  return { value: visit(value), redactions };
}

function isRedacted(value: unknown): value is string {
  return typeof value === "string" && /^\[REDACTED(?::[^\]]+)?\]$/.test(value);
}

async function copyText(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch {
    // Fall through to the selection-based compatibility path.
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy unavailable");
}
