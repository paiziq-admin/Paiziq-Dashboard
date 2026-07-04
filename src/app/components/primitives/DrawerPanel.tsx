import type { ReactNode } from "react";

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
  if (!open) return null;

  return (
    <>
      <button
        aria-label="Close drawer overlay"
        className="fixed inset-0 z-40 border-0 bg-[rgba(58,47,60,0.25)] backdrop-blur-[2px]"
        type="button"
        onClick={onClose}
      />
      <aside
        aria-modal="true"
        className="fixed bottom-0 right-0 top-0 z-50 w-[420px] max-w-[92vw] overflow-y-auto border-l border-[rgba(255,255,255,0.8)] bg-[rgba(255,255,255,0.85)] p-[24px] shadow-[-16px_0_48px_rgba(86,66,86,0.22)] backdrop-blur-[28px]"
        role="dialog"
      >
        <div className="mb-[18px] flex items-center justify-between">
          <div className="text-[16px] font-extrabold">{title}</div>
          <button
            aria-label="Close drawer"
            className="focus-ring h-[28px] w-[28px] rounded-[8px] border-0 bg-[rgba(86,66,86,0.08)] text-[14px] text-[var(--primary)]"
            type="button"
            onClick={onClose}
          >
            x
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

