import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductFilters({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Filtres boutique" description="Filtre par categorie, condition, couleur, prix, location et stock.">
      {children}
    </ModulePanel>
  );
}
