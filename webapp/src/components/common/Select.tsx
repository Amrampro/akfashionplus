import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function Select({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Selection AK" description="Controle de selection pour langues, categories, statuts et branches.">
      {children}
    </ModulePanel>
  );
}
