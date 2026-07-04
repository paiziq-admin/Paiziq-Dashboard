export interface RiskRule {
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  lastUpdated: string;
}

export const policyThresholds = {
  allow: 39,
  review: 69,
};

export const policyVersions = [
  { version: "v2.3.1", status: "Active", created: "2026-05-20 14:32", createdBy: "admin@company.com", action: "View" },
  { version: "v2.3.0", status: "Inactive", created: "2026-05-15 09:12", createdBy: "admin@company.com", action: "Rollback" },
  { version: "v2.2.8", status: "Inactive", created: "2026-05-10 16:45", createdBy: "sarah.chen@company.com", action: "Rollback" },
];

export const riskRules: RiskRule[] = [
  { name: "High Amount Check", description: "Flags transactions above user average", weight: 20, enabled: true, lastUpdated: "2026-05-15" },
  { name: "New Recipient", description: "First-time recipient for this user", weight: 15, enabled: true, lastUpdated: "2026-05-10" },
  { name: "Velocity Check", description: "Multiple transactions in short time", weight: 25, enabled: true, lastUpdated: "2026-05-20" },
  { name: "Location Anomaly", description: "Transaction from unusual location", weight: 18, enabled: true, lastUpdated: "2026-05-08" },
  { name: "Device Fingerprint", description: "New or suspicious device", weight: 12, enabled: true, lastUpdated: "2026-05-12" },
  { name: "Trusted Merchant", description: "Known reputable recipient", weight: -10, enabled: true, lastUpdated: "2026-05-05" },
  { name: "User History", description: "Positive payment history", weight: -8, enabled: true, lastUpdated: "2026-05-03" },
  { name: "Cross-border Flag", description: "International transaction", weight: 10, enabled: false, lastUpdated: "2026-04-28" },
];

export const allowList = ["merchant_5501", "user_9201", "192.168.1.100"];
export const blockList = ["merchant_9982", "45.123.45.67"];

