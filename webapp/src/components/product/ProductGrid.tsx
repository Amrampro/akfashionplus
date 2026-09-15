import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductGrid({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Grille produits" description="Dispose les produits en grille responsive pour boutique et favoris.">
      {children}
    </ModulePanel>
  );
}
