// Mock data for the Payment Agent Audit Layer dashboard

export interface Payment {
  id: string;
  timestamp: string;
  agent: string;
  user: string;
  amount: number;
  currency: string;
  recipient: string;
  riskScore: number;
  decision: 'approved' | 'blocked' | 'review_required' | 'pending';
  reviewStatus?: 'assigned' | 'in_progress' | 'completed';
  triggeredSignals: string[];
  environment: string;
}

export interface RiskSignal {
  name: string;
  value: number;
  description: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  details?: string;
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  reason?: string;
}

export const mockPayments: Payment[] = [
  {
    id: 'PAY-2026-05-30-8472',
    timestamp: '2026-05-30T14:23:15Z',
    agent: 'checkout-service-prod',
    user: 'user_4728',
    amount: 12500.00,
    currency: 'USD',
    recipient: 'merchant_8821',
    riskScore: 72,
    decision: 'blocked',
    triggeredSignals: ['High amount', 'New recipient', 'Unusual time'],
    environment: 'production'
  },
  {
    id: 'PAY-2026-05-30-8471',
    timestamp: '2026-05-30T14:19:42Z',
    agent: 'mobile-app-v3',
    user: 'user_3892',
    amount: 450.00,
    currency: 'USD',
    recipient: 'merchant_1204',
    riskScore: 48,
    decision: 'review_required',
    reviewStatus: 'assigned',
    triggeredSignals: ['Unusual user behavior', 'New recipient'],
    environment: 'production'
  },
  {
    id: 'PAY-2026-05-30-8470',
    timestamp: '2026-05-30T14:15:28Z',
    agent: 'checkout-service-prod',
    user: 'user_9201',
    amount: 89.99,
    currency: 'USD',
    recipient: 'merchant_5501',
    riskScore: 18,
    decision: 'approved',
    triggeredSignals: [],
    environment: 'production'
  },
  {
    id: 'PAY-2026-05-30-8469',
    timestamp: '2026-05-30T14:12:03Z',
    agent: 'web-checkout-v2',
    user: 'user_5623',
    amount: 2200.00,
    currency: 'EUR',
    recipient: 'merchant_3304',
    riskScore: 55,
    decision: 'review_required',
    reviewStatus: 'in_progress',
    triggeredSignals: ['High amount', 'Cross-border transaction'],
    environment: 'production'
  },
  {
    id: 'PAY-2026-05-30-8468',
    timestamp: '2026-05-30T14:08:17Z',
    agent: 'mobile-app-v3',
    user: 'user_1047',
    amount: 125.50,
    currency: 'USD',
    recipient: 'merchant_1204',
    riskScore: 12,
    decision: 'approved',
    triggeredSignals: [],
    environment: 'production'
  },
  {
    id: 'PAY-2026-05-30-8467',
    timestamp: '2026-05-30T14:03:45Z',
    agent: 'checkout-service-staging',
    user: 'test_user_42',
    amount: 999.99,
    currency: 'USD',
    recipient: 'test_merchant_01',
    riskScore: 5,
    decision: 'approved',
    triggeredSignals: [],
    environment: 'staging'
  },
  {
    id: 'PAY-2026-05-30-8466',
    timestamp: '2026-05-30T13:58:22Z',
    agent: 'web-checkout-v2',
    user: 'user_7734',
    amount: 8900.00,
    currency: 'GBP',
    recipient: 'merchant_9982',
    riskScore: 68,
    decision: 'review_required',
    reviewStatus: 'assigned',
    triggeredSignals: ['High amount', 'New recipient', 'Velocity check'],
    environment: 'production'
  },
  {
    id: 'PAY-2026-05-30-8465',
    timestamp: '2026-05-30T13:52:11Z',
    agent: 'mobile-app-v3',
    user: 'user_2910',
    amount: 34.99,
    currency: 'USD',
    recipient: 'merchant_5501',
    riskScore: 8,
    decision: 'approved',
    triggeredSignals: [],
    environment: 'production'
  },
];

export const riskSignals: RiskSignal[] = [
  { name: 'Amount risk', value: 20, description: 'Payment amount exceeds typical user pattern' },
  { name: 'New recipient', value: 15, description: 'First time sending to this recipient' },
  { name: 'Unusual user behavior', value: 25, description: 'Login from new device/location' },
  { name: 'Trusted merchant', value: -10, description: 'Recipient has strong reputation' },
  { name: 'Previous successful payments', value: -8, description: 'User has positive history' },
];

export const timelineEvents: TimelineEvent[] = [
  { timestamp: '2026-05-30T14:19:42.123Z', event: 'SDK event received', details: 'Payment request from mobile-app-v3' },
  { timestamp: '2026-05-30T14:19:42.245Z', event: 'Risk score calculated', details: 'Score: 48 (Review Required)' },
  { timestamp: '2026-05-30T14:19:42.298Z', event: 'Policy evaluated', details: 'Policy v2.3.1 applied' },
  { timestamp: '2026-05-30T14:19:42.312Z', event: 'Decision made', details: 'Human review required' },
  { timestamp: '2026-05-30T14:19:42.401Z', event: 'Human review opened', details: 'Assigned to review queue' },
  { timestamp: '2026-05-30T14:19:42.567Z', event: 'Webhook delivered', details: 'Status sent to agent' },
];

export const auditLogEntries: AuditLogEntry[] = [
  {
    timestamp: '2026-05-30T14:30:15Z',
    actor: 'sarah.chen@company.com',
    action: 'Approved payment',
    entity: 'PAY-2026-05-30-8469',
    previousValue: 'review_required',
    newValue: 'approved',
    ipAddress: '192.168.1.45',
    reason: 'User verification completed, legitimate transaction'
  },
  {
    timestamp: '2026-05-30T14:25:08Z',
    actor: 'admin@company.com',
    action: 'Updated policy threshold',
    entity: 'Policy v2.3.1',
    previousValue: 'review_threshold: 45',
    newValue: 'review_threshold: 40',
    ipAddress: '192.168.1.22',
    reason: 'Reducing false positives based on last week analysis'
  },
  {
    timestamp: '2026-05-30T14:18:33Z',
    actor: 'james.kumar@company.com',
    action: 'Rejected payment',
    entity: 'PAY-2026-05-30-8467',
    previousValue: 'review_required',
    newValue: 'blocked',
    ipAddress: '192.168.1.78',
    reason: 'Recipient on watchlist, fraud pattern detected'
  },
  {
    timestamp: '2026-05-30T13:45:12Z',
    actor: 'system',
    action: 'Created API key',
    entity: 'api_key_prod_8821',
    ipAddress: '10.0.0.5',
    reason: 'New agent registration: checkout-service-v4'
  },
];

export const agents = [
  {
    name: 'checkout-service-prod',
    environment: 'production',
    sdkVersion: '2.4.1',
    lastEventReceived: '2 minutes ago',
    errorRate: '0.02%',
    decisionLatency: '145ms',
    webhookSuccessRate: '99.8%',
    status: 'healthy'
  },
  {
    name: 'mobile-app-v3',
    environment: 'production',
    sdkVersion: '2.3.8',
    lastEventReceived: '5 minutes ago',
    errorRate: '0.15%',
    decisionLatency: '178ms',
    webhookSuccessRate: '99.2%',
    status: 'healthy'
  },
  {
    name: 'web-checkout-v2',
    environment: 'production',
    sdkVersion: '2.4.0',
    lastEventReceived: '8 minutes ago',
    errorRate: '0.08%',
    decisionLatency: '132ms',
    webhookSuccessRate: '99.9%',
    status: 'healthy'
  },
  {
    name: 'checkout-service-staging',
    environment: 'staging',
    sdkVersion: '2.5.0-beta',
    lastEventReceived: '12 minutes ago',
    errorRate: '1.2%',
    decisionLatency: '245ms',
    webhookSuccessRate: '97.5%',
    status: 'warning'
  },
];

export const riskRules = [
  { name: 'High Amount Check', description: 'Flags transactions above user average', weight: 20, enabled: true, lastUpdated: '2026-05-15' },
  { name: 'New Recipient', description: 'First-time recipient for this user', weight: 15, enabled: true, lastUpdated: '2026-05-10' },
  { name: 'Velocity Check', description: 'Multiple transactions in short time', weight: 25, enabled: true, lastUpdated: '2026-05-20' },
  { name: 'Location Anomaly', description: 'Transaction from unusual location', weight: 18, enabled: true, lastUpdated: '2026-05-08' },
  { name: 'Device Fingerprint', description: 'New or suspicious device', weight: 12, enabled: true, lastUpdated: '2026-05-12' },
  { name: 'Trusted Merchant', description: 'Known reputable recipient', weight: -10, enabled: true, lastUpdated: '2026-05-05' },
  { name: 'User History', description: 'Positive payment history', weight: -8, enabled: true, lastUpdated: '2026-05-03' },
  { name: 'Cross-border Flag', description: 'International transaction', weight: 10, enabled: false, lastUpdated: '2026-04-28' },
];
