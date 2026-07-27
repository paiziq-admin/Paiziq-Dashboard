const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatAmount(payment: { amount: number; currency: string }) {
  const symbol = currencySymbols[payment.currency] ?? "";
  return `${symbol}${payment.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${payment.currency}`;
}

export function formatTime(timestamp: string | number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toISOString().slice(5, 16).replace("T", " ")} UTC`;
}

export function formatClock(timestamp: string | number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(11, 19);
}

export function formatDateTime(timestamp: string | number | null | undefined) {
  if (timestamp == null) return "-";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function truncateSignals(signals: string[]) {
  if (signals.length === 0) return "-";
  return `${signals.slice(0, 2).join(", ")}${signals.length > 2 ? ` +${signals.length - 2}` : ""}`;
}
