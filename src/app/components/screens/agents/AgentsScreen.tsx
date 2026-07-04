import { useState } from "react";
import { agents, apiKeys, sdkErrors } from "../../../data/agents";
import { ActionButton, GlassPanel, GridCell, GridRow, GridTable, MetricCard, StatusBadge } from "../../primitives";

const columns = "minmax(190px,1.3fr) 110px 90px minmax(120px,1fr) 90px 80px 90px 100px";

export function AgentsScreen() {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  return (
    <section data-screen-label="Agent and SDK Monitoring">
      <h1 className="page-title mb-[16px]">Agent &amp; SDK Monitoring</h1>

      <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[12px]">
        <MetricCard label="Total Agents" value="12" />
        <MetricCard label="Healthy Agents" value="9 / 12" />
        <MetricCard label="Avg Decision Latency" value="152ms" />
        <MetricCard label="Webhook Success" value="99.4%" />
      </div>

      <GlassPanel className="mb-[18px] overflow-hidden">
        <div className="p-[16px_16px_8px] text-[14px] font-bold">Registered Agents</div>
        <GridTable columns={columns} headers={["Agent Name", "Environment", "SDK", "Last Event", "Error Rate", "Latency", "Webhook", "Status"]} minWidth={940}>
          {agents.map((agent) => (
            <GridRow columns={columns} key={agent.name}>
              <GridCell className="mono whitespace-nowrap font-semibold">{agent.name}</GridCell>
              <GridCell><StatusBadge>{agent.environment}</StatusBadge></GridCell>
              <GridCell className="mono text-[12px]">{agent.sdkVersion}</GridCell>
              <GridCell className="whitespace-nowrap text-[var(--text-secondary)]">{agent.lastEventReceived}</GridCell>
              <GridCell className="mono text-right">{agent.errorRate}</GridCell>
              <GridCell className="mono text-right">{agent.decisionLatency}</GridCell>
              <GridCell className="mono text-right">{agent.webhookSuccessRate}</GridCell>
              <GridCell><StatusBadge tone={agent.status === "healthy" ? "success" : agent.status === "warning" ? "warning" : "danger"}>{agent.status}</StatusBadge></GridCell>
            </GridRow>
          ))}
        </GridTable>
      </GlassPanel>

      <div className="responsive-stack grid grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)] items-start gap-[16px]">
        <GlassPanel className="min-w-0 p-[18px]">
          <div className="panel-title">Recent SDK Errors</div>
          <GridTable columns="130px minmax(160px,1fr) 110px minmax(220px,1.6fr)" headers={["Timestamp", "Agent", "Type", "Message"]} minWidth={560}>
            {sdkErrors.map((error) => (
              <GridRow columns="130px minmax(160px,1fr) 110px minmax(220px,1.6fr)" key={`${error.timestamp}-${error.agent}`}>
                <GridCell className="mono whitespace-nowrap text-[12px]">{error.timestamp}</GridCell>
                <GridCell className="mono text-[12px]">{error.agent}</GridCell>
                <GridCell><StatusBadge tone={error.type === "Validation" ? "warning" : "danger"}>{error.type}</StatusBadge></GridCell>
                <GridCell className="text-[12px] text-[var(--text-secondary)]">{error.message}</GridCell>
              </GridRow>
            ))}
          </GridTable>
        </GlassPanel>

        <GlassPanel className="p-[18px]">
          <div className="panel-title mb-[4px]">API Key Management</div>
          <div className="mb-[14px] text-[12px] text-[var(--muted-foreground)]">Create and manage keys for agent authentication.</div>
          <ActionButton className="mb-[16px] w-full" variant="aubergine">Create New API Key</ActionButton>
          <div className="label-caps mb-[8px]">Active Keys</div>
          <div className="flex flex-col gap-[10px]">
            {apiKeys.map((key) => {
              const visible = !!visibleKeys[key.id];
              return (
                <div className="rounded-[10px] border border-[rgba(86,66,86,0.12)] bg-[rgba(255,255,255,0.5)] p-[11px_12px]" key={key.id}>
                  <div className="mb-[6px] flex items-center justify-between">
                    <span className="text-[12px] font-bold">{key.label}</span>
                    <button className="focus-ring h-[24px] rounded-[7px] border border-[rgba(86,66,86,0.18)] bg-[rgba(255,255,255,0.7)] px-[10px] text-[11px] font-bold text-[var(--primary)]" type="button" onClick={() => setVisibleKeys({ ...visibleKeys, [key.id]: !visible })}>
                      {visible ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <div className="mono rounded-[7px] bg-[rgba(86,66,86,0.07)] p-[7px_10px] text-[12px]">{visible ? key.visible : key.masked}</div>
                  <div className="mt-[6px] flex justify-between">
                    <span className="text-[11px] text-[var(--muted-foreground)]">Created {key.created}</span>
                    <button className="button-reset text-[11px] font-bold text-[var(--danger-text)]" type="button">Revoke</button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}

