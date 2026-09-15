import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function CashierSidebar({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Navigation caisse" description="Navigation guichet pour retraits, reventes, locations et historique.">
      {children}
    </ModulePanel>
  );
}
