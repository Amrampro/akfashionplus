import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function Button({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Bouton AK" description="Bouton standard avec etat principal, secondaire ou action.">
      {children}
    </ModulePanel>
  );
}
