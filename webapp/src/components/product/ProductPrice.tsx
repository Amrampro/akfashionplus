import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductPrice({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Prix produit" description="Formate prix de vente, location par jour et conversion secondaire.">
      {children}
    </ModulePanel>
  );
}
