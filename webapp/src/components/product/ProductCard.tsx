import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Carte produit" description="Affiche visuel, nom, prix multidevise, rating, achat et location.">
      {children}
    </ModulePanel>
  );
}
