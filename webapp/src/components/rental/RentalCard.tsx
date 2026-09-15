import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function RentalCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Carte location" description="Resume une location avec dates, depot, statut et retour prevu.">
      {children}
    </ModulePanel>
  );
}
