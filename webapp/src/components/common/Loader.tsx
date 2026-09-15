import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function Loader({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Chargement" description="Etat de chargement propre pour listes, paiements et dashboards.">
      {children}
    </ModulePanel>
  );
}
