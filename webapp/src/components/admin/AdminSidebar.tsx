import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function AdminSidebar({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Navigation admin" description="Navigation back-office pour catalogue, commandes, utilisateurs et parametres.">
      {children}
    </ModulePanel>
  );
}
