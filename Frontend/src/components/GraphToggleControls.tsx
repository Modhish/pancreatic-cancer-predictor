import React from "react";

export type GraphKey = "waterfall" | "bar" | "line" | "beeswarm";

export interface GraphControl {
  key: GraphKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface GraphToggleControlsProps {
  controls: GraphControl[];
  visibility: Record<GraphKey, boolean>;
  onToggle: (key: GraphKey) => void;
  t: (key: string) => string;
}

export default function GraphToggleControls(
  props: GraphToggleControlsProps,
): JSX.Element {
  const { controls, visibility, onToggle } = props;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[0.75rem]">
      <span className="text-[var(--muted)]">Graphs:</span>
      {controls.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onToggle(key)}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 transition ${
            visibility[key]
              ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--text)] shadow-[0_8px_18px_rgba(29,185,84,0.2)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
