import { useState, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, count, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="collapsible-section">
      <button
        type="button"
        className="collapsible-section-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className={`collapsible-section-chevron${open ? " open" : ""}`} aria-hidden="true">
          ▸
        </span>
        <h2>
          {title} ({count})
        </h2>
      </button>
      {open && <div className="collapsible-section-body">{children}</div>}
    </section>
  );
}
