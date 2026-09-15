import type { ReactNode } from "react";

type ModulePanelProps = {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

export default function ModulePanel({ children, className = "", description, title }: ModulePanelProps) {
  return (
    <section className={`module-panel ${className}`.trim()}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {children || (
        <div className="module-lines">
          <span />
          <span />
          <span />
        </div>
      )}
    </section>
  );
}
