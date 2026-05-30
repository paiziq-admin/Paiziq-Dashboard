Create a baseline web dashboard UI for a product called “Payment Agent Audit Layer”.

The product monitors payment agents and provides risk scoring, audit trails, trace inspection, and human-in-the-loop payment approvals.

Design style:
- Enterprise SaaS dashboard
- Clean, modern, high-trust fintech feel
- Dense but readable information layout
- Light theme by default
- Use restrained colors: white, slate, gray, blue, green, amber, red
- Avoid marketing/landing-page styling
- Prioritize operational clarity, fast triage, and auditability

Create these core screens:

1. Overview Dashboard
Layout:
- Left sidebar navigation
- Top bar with environment switcher, global search, notifications, user menu
- Summary metric cards:
  - Total Payment Attempts
  - Approved
  - Blocked
  - Pending Human Review
  - Total Payment Volume
  - Average Risk Score
- Charts:
  - Payment volume over time
  - Decision distribution: Approved, Blocked, Review Required
  - Risk score distribution
- Tables:
  - Recent high-risk payments
  - Agents with highest flagged activity
- Include status indicators for SDK ingestion health and webhook delivery health

2. Live Payment Feed
Create a table-heavy operational screen with:
- Filters for date range, decision status, risk score range, amount range, agent, environment, currency
- Payment table columns:
  - Payment ID
  - Timestamp
  - Agent
  - User
  - Amount
  - Currency
  - Recipient
  - Risk Score
  - Decision
  - Review Status
  - Triggered Signals
- Use colored status badges:
  - Approved = green
  - Blocked = red
  - Review Required = amber
  - Pending = blue/gray
- Include a right-side quick preview panel when a row is selected

3. Payment Detail / Trace View
This should be the most important screen.
Include:
- Header with Payment ID, decision status, risk score, amount, timestamp
- Timeline of events:
  - SDK event received
  - Risk score calculated
  - Policy evaluated
  - Decision made
  - Human review opened
  - Reviewer action taken
  - Webhook delivered
- Risk score breakdown panel:
  - Amount risk +20
  - New recipient +15
  - Unusual user behavior +25
  - Trusted merchant -10
  - Previous successful payments -8
  - Final score 42
- Policy information:
  - Policy version
  - Thresholds:
    - 0-39 Allow
    - 40-69 Human Review
    - 70+ Block
- Agent trace panel with structured JSON-like data
- Webhook delivery logs
- Audit trail section
- Clear action buttons if review is required:
  - Approve
  - Reject
  - Request More Info
  - Escalate

4. Human Review Queue
Create a review workflow screen with:
- Queue table on the left
- Review detail panel on the right
- Filters for SLA, risk score, amount, agent, assignee, decision type
- Queue columns:
  - Priority
  - Payment ID
  - Amount
  - Risk Score
  - Top Risk Reasons
  - SLA Deadline
  - Assignee
- Review detail panel should show:
  - Payment summary
  - User/payment history
  - Recipient history
  - Top risk signals
  - Agent trace summary
  - Reviewer notes
  - Action buttons:
    - Approve Payment
    - Reject Payment
    - Escalate
- Include a required note field before final approval/rejection

5. Risk Policy & Threshold Management
Create an admin configuration screen with:
- Policy version list
- Active policy status
- Threshold editor:
  - Allow threshold
  - Human review threshold
  - Block threshold
- Rule weight table:
  - Rule name
  - Description
  - Weight
  - Enabled toggle
  - Last updated
- Allowlist/blocklist section
- “Simulate Policy” panel where a user can enter payment amount, recipient age, user history, region, and see predicted decision
- Buttons:
  - Save Draft
  - Test Policy
  - Publish Policy

6. Agent & SDK Monitoring
Create a developer-focused screen with:
- Registered agents/apps table
- Columns:
  - Agent Name
  - Environment
  - SDK Version
  - Last Event Received
  - Error Rate
  - Decision Latency
  - Webhook Success Rate
  - Status
- Integration health cards
- Recent SDK errors table
- API key section with masked keys and controls to create/revoke keys

7. Audit Log
Create a compliance-focused screen with:
- Search and filters for actor, event type, entity type, payment ID, agent ID, date range
- Immutable audit log table:
  - Timestamp
  - Actor
  - Action
  - Entity
  - Previous Value
  - New Value
  - IP Address
  - Reason
- Detail drawer showing full event metadata

Navigation structure:
- Overview
- Payment Feed
- Human Reviews
- Risk Policies
- Agents & SDK
- Audit Log
- Alerts
- Settings

Important UX requirements:
- The UI should feel like a serious fintech/risk operations tool
- Do not create a landing page
- First screen should be the actual dashboard
- Use compact tables, filters, drawers, panels, badges, tabs, and timeline components
- Make risk scores visually obvious
- Make human review actions prominent but controlled
- Require reviewer notes for approve/reject actions
- Include empty states, loading states, and error states where appropriate
- Use realistic sample data throughout
- Design for desktop first, 1440px wide
- Also include responsive tablet/mobile considerations for the main screens

Generate a complete baseline clickable prototype with consistent components, spacing, typography, and design tokens.