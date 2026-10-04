import { useEffect, useId, useRef, type ReactNode } from "react";

export function DrawerPanel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const frame = window.requestAnimationFrame(() => {
      const first = focusableElements(panel)[0];
      (first ?? panel)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = focusableElements(panel);
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
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
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 border-0 bg-[rgba(58,47,60,0.25)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed bottom-0 right-0 top-0 z-50 w-[420px] max-w-[92vw] overflow-y-auto border-l border-[var(--glass-border-strong)] bg-[var(--popover)] p-[24px] text-[var(--popover-foreground)] shadow-[-16px_0_48px_rgba(86,66,86,0.22)] backdrop-blur-[28px]"
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-[18px] flex items-center justify-between">
          <div className="text-[16px] font-extrabold" id={titleId}>{title}</div>
          <button
            aria-label="Close drawer"
            className="focus-ring h-[28px] w-[28px] rounded-[8px] border-0 bg-[rgba(86,66,86,0.08)] text-[14px] text-[var(--primary)]"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

function focusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
}
