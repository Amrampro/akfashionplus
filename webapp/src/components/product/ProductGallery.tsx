import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductGallery({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Galerie produit" description="Affiche image principale, miniatures et etats visuels produit.">
      {children}
    </ModulePanel>
  );
}
