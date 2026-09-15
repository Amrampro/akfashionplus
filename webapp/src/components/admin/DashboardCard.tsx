import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function DashboardCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Bloc dashboard" description="Carte analytique pour indicateurs globaux et operations recentes.">
      {children}
    </ModulePanel>
  );
}
