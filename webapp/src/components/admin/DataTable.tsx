import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function DataTable({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Table donnees" description="Table responsive pour listes admin, cashier et client.">
      {children}
    </ModulePanel>
  );
}
