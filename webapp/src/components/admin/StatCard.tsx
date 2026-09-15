import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function StatCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Indicateur" description="Carte KPI pour commandes, revenu, locations ou cartes cadeaux.">
      {children}
    </ModulePanel>
  );
}
