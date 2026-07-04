import type { TimelineEvent } from "../../data/payments";

const dotColor = {
  done: "var(--accent)",
  pending: "var(--neutral)",
  system: "var(--primary)",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative pl-[24px]">
      <div className="absolute bottom-[8px] left-[7px] top-[8px] w-[2px] bg-[rgba(86,66,86,0.14)]" />
      {events.map((event) => (
        <div className="relative pb-[18px]" key={`${event.event}-${event.time}`}>
          <span
            className="absolute left-[-22px] top-[4px] h-[12px] w-[12px] rounded-full border-[2.5px] border-white shadow-[0_0_0_1px_rgba(86,66,86,0.15)]"
            style={{ background: dotColor[event.state ?? "done"] }}
          />
          <div className="text-[13.5px] font-bold">{event.event}</div>
          <div className="my-[1px] text-[12.5px] text-[var(--text-secondary)]">{event.details}</div>
          <div className="mono text-[11.5px] text-[var(--muted-foreground)]">{event.time}</div>
        </div>
      ))}
    </div>
  );
}

