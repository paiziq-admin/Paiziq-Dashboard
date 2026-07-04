export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress: string;
  reason?: string;
}

export const auditLogEntries: AuditLogEntry[] = [
  {
    timestamp: "2026-05-30T14:30:15Z",
    actor: "sarah.chen@company.com",
    action: "Approved payment",
    entity: "PAY-2026-05-30-8469",
    previousValue: "review_required",
    newValue: "approved",
    ipAddress: "192.168.1.45",
    reason: "User verification completed, legitimate transaction",
  },
  {
    timestamp: "2026-05-30T14:25:08Z",
    actor: "admin@company.com",
    action: "Updated policy threshold",
    entity: "Policy v2.3.1",
    previousValue: "review_threshold: 45",
    newValue: "review_threshold: 40",
    ipAddress: "192.168.1.22",
    reason: "Reducing false positives based on last week analysis",
  },
  {
    timestamp: "2026-05-30T14:18:33Z",
    actor: "james.kumar@company.com",
    action: "Rejected payment",
    entity: "PAY-2026-05-30-8467",
    previousValue: "review_required",
    newValue: "blocked",
    ipAddress: "192.168.1.78",
    reason: "Recipient on watchlist, fraud pattern detected",
  },
  {
    timestamp: "2026-05-30T13:45:12Z",
    actor: "system",
    action: "Created API key",
    entity: "api_key_prod_8821",
    previousValue: null,
    newValue: null,
    ipAddress: "10.0.0.5",
    reason: "New agent registration: checkout-service-v4",
  },
];

