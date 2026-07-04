import { useState } from "react";
import { GlassPanel } from "../../primitives";

export function SettingsScreen() {
  const [emailCritical, setEmailCritical] = useState(true);
  const [slackSla, setSlackSla] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <section data-screen-label="Settings">
      <h1 className="page-title mb-[16px]">Settings</h1>
      <div className="flex max-w-[640px] flex-col gap-[16px]">
        <GlassPanel className="p-[20px]">
          <div className="panel-title mb-[14px]">Organization</div>
          <label className="mb-[12px] block text-[12px] font-bold">
            Organization name
            <input className="control mt-[4px] w-full" defaultValue="Acme Payments Inc." />
          </label>
          <label className="block text-[12px] font-bold">
            Timezone
            <select className="control mt-[4px] w-full" defaultValue="UTC">
              <option>UTC</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
            </select>
          </label>
        </GlassPanel>

        <GlassPanel className="p-[20px]">
          <div className="panel-title mb-[14px]">Notifications</div>
          <div className="flex flex-col gap-[12px] text-[13px]">
            <ToggleRow label="Email on critical alerts" enabled={emailCritical} onToggle={() => setEmailCritical(!emailCritical)} />
            <ToggleRow label="Slack on SLA breaches" enabled={slackSla} onToggle={() => setSlackSla(!slackSla)} />
            <ToggleRow label="Weekly risk digest" enabled={weeklyDigest} onToggle={() => setWeeklyDigest(!weeklyDigest)} />
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}

function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <button
        aria-pressed={enabled}
        className="focus-ring relative h-[20px] w-[36px] rounded-[999px] border-0 transition"
        style={{ background: enabled ? "var(--accent)" : "rgba(86,66,86,0.2)" }}
        type="button"
        onClick={onToggle}
      >
        <span className="absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white transition-[left]" style={{ left: enabled ? 18 : 2 }} />
      </button>
    </div>
  );
}

