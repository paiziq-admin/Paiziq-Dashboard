import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { ActionButton } from "./ActionButton";

export function EmptyState({
  title,
  body,
  action,
  onAction,
  icon,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="p-[60px_20px] text-center">
      <div className="mx-auto mb-[14px] flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-[rgba(86,66,86,0.08)] text-[var(--muted-foreground)]">
        {icon ?? <Search size={22} strokeWidth={1.8} />}
      </div>
      <div className="mb-[4px] text-[14px] font-bold">{title}</div>
      <div className="mb-[14px] text-[12.5px] text-[var(--muted-foreground)]">{body}</div>
      {action && onAction ? (
        <ActionButton className="h-[32px]" onClick={onAction} type="button">
          {action}
        </ActionButton>
      ) : null}
    </div>
  );
}

