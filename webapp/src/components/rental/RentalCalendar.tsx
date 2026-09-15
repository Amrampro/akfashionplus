import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function RentalCalendar({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Calendrier location" description="Selectionne les dates de debut et fin avec verification disponibilite.">
      {children}
    </ModulePanel>
  );
}
