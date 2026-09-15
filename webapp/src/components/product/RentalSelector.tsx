import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function RentalSelector({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Selection location" description="Controle dates, depot, duree et disponibilite location.">
      {children}
    </ModulePanel>
  );
}
