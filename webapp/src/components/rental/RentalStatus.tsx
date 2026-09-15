import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function RentalStatus({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Statut location" description="Affiche reservee, active, retour due, overdue ou retournee.">
      {children}
    </ModulePanel>
  );
}
