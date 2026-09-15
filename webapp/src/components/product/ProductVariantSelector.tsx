import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductVariantSelector({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Variantes produit" description="Selection taille, couleur, stock et variante active.">
      {children}
    </ModulePanel>
  );
}
