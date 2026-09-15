import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function Modal({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Fenetre modale" description="Conteneur modal pour confirmations et editions rapides.">
      {children}
    </ModulePanel>
  );
}
