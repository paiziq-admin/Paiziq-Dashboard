export function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="mono m-0 overflow-x-auto rounded-[10px] bg-[var(--code-bg)] p-[16px] text-[12px] leading-[1.55] text-[var(--code-text)]">
      {value}
    </pre>
  );
}

