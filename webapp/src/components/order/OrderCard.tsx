import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function OrderCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Carte commande" description="Resume une commande avec statut, numero, total et prochaine action.">
      {children}
    </ModulePanel>
  );
}
